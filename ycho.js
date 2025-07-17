/**
 * 益宠领养小程序签到
 * 环境变量格式：
 * - 每组参数用 @ 分隔：iv值@加密请求体数据
 * - 多个账号用 & 分隔
 * export ychoParams='iv1@data1&iv2@data2'
 *
 * 抓包方法：
 * 1. 微信小程序 - 益宠领养
 * 2. 抓取 https://wpet.ycho.cc/integral/user/sign 请求
 * 3. 复制 iv 头部值和请求体加密数据
 */

const $ = new Env('益宠领养小程序签到');
const got = require('got');

const ENV_NAME = 'ychoParams';
const ACCOUNT_LIST = process.env[ENV_NAME]
  ? process.env[ENV_NAME].split('&').filter(Boolean)
  : [];

const RETRY_CODES = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];

async function main () {
  if (ACCOUNT_LIST.length === 0) {
    console.log(`❌ 请设置环境变量 ${ENV_NAME}`);
    console.log('格式: export ychoParams="iv值@加密数据&iv值2@加密数据2"');
    return;
  }

  console.log(`🔍 共检测到 ${ACCOUNT_LIST.length} 个账号配置`);

  for (let i = 0; i < ACCOUNT_LIST.length; i++) {
    const parts = ACCOUNT_LIST[i].split('@');
    const iv = parts[0];
    const encryptedData = parts[1];

    if (!iv || !encryptedData) {
      console.log(`⚠️ 第 ${i + 1} 个账号参数不完整，需要 iv@加密数据 格式`);
      continue;
    }

    console.log(`\n===> 开始处理账号 ${i + 1}`);
    await handleAccount(iv, encryptedData, i + 1);

    // 账号间隔时间
    if (i < ACCOUNT_LIST.length - 1) {
      await delay(2000);
    }
  }
}

async function handleAccount (iv, encryptedData, accountIndex) {
  try {
    const result = await sendSignRequest(iv, encryptedData);
    showResult(result, accountIndex);
  } catch (e) {
    console.log(`❌ 账号 ${accountIndex} 签到失败: ${e.message}`);
  }
}

async function sendSignRequest (iv, encryptedData) {
  const url = 'https://wpet.ycho.cc/integral/user/sign';

  for (let retry = 1; retry <= 3; retry++) {
    try {
      const res = await got.post(url, {
        headers: {
          'Host': 'wpet.ycho.cc',
          'Connection': 'keep-alive',
          'iv': iv,
          'content-type': 'application/json',
          'Accept-Encoding': 'gzip,compress,br,deflate',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.61(0x18003d2a) NetType/WIFI Language/zh_CN',
          'Referer': 'https://servicewechat.com/wx19a23bf94a923f70/325/page-frame.html'
        },
        body: encryptedData,
        timeout: 10000,
      });

      return {
        statusCode: res.statusCode,
        headers: res.headers,
        body: res.body
      };
    } catch (e) {
      if (RETRY_CODES.includes(e.code) && retry < 3) {
        console.log(`↻ 请求失败，重试第 ${retry} 次: ${e.message}`);
        await delay(1500);
        continue;
      }
      throw e;
    }
  }
}

function showResult (data, accountIndex) {
  if (!data) {
    console.log(`⚠️ 账号 ${accountIndex} 签到无返回数据`);
    return;
  }

  console.log(`✅ 账号 ${accountIndex} 签到响应:`);
  console.log(`状态码: ${data.statusCode}`);

  if (data.headers.iv) {
    console.log(`响应IV: ${data.headers.iv}`);
  }

  if (data.body) {
    console.log(`响应数据: ${data.body}`);

    // 简单判断签到结果
    if (data.statusCode === 200) {
      console.log(`🎉 账号 ${accountIndex} 签到请求成功`);
    } else {
      console.log(`⚠️ 账号 ${accountIndex} 签到状态异常`);
    }
  }
}

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 青龙通知类封装（可配合 sendNotify.js）
function Env (name) {
  return new (class {
    constructor(name) {
      this.name = name;
      this.notifyMsgs = [];
    }
    log (msg, opt = {}) {
      console.log(msg);
      if (opt.notify) this.notifyMsgs.push(msg);
    }
    async sendNotify () {
      if (this.notifyMsgs.length > 0) {
        const notify = require('./sendNotify');
        await notify.sendNotify(this.name, this.notifyMsgs.join('\n'));
      }
    }
  })(name);
}

// 入口
main().catch(console.error);
