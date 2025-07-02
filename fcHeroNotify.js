/**
 * 通知侠小程序增加通知次数
 * 环境变量格式：
 * - 每组参数用 @ 分隔：
 * - authToken：完整的 JWT token（从 authorization: 字段中复制）
 * - 次数：该账号执行请求的次数
 * export fcHeroNotifyParams='authToken1@5&authToken2@10'
 */

const $ = new Env('通知侠小程序增加通知次数');
const got = require('got');

const ENV_NAME = 'fcHeroNotifyParams';
const ACCOUNT_LIST = process.env[ENV_NAME]
  ? process.env[ENV_NAME].split('&').filter(Boolean)
  : [];

const RETRY_CODES = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];

async function main () {
  if (ACCOUNT_LIST.length === 0) {
    console.log(`❌ 请设置环境变量 ${ENV_NAME}`);
    return;
  }

  console.log(`🔍 共检测到 ${ACCOUNT_LIST.length} 个账号配置`);

  for (let i = 0; i < ACCOUNT_LIST.length; i++) {
    const parts = ACCOUNT_LIST[i].split('@');
    const token = parts[0];
    const count = parseInt(parts[1]) || 1;

    if (!token) {
      console.log(`⚠️ 第 ${i + 1} 个账号参数不完整`);
      continue;
    }

    console.log(`\n===> 开始处理账号 ${i + 1}，请求次数: ${count}`);
    for (let j = 0; j < count; j++) {
      console.log(`➡️ 第 ${j + 1} 次请求`);
      await handleAccount(token, i + 1, j + 1);
      await delay(1000); // 1秒间隔，避免风控
    }
  }
}

async function handleAccount (token, accountIndex, reqIndex) {
  try {
    const result = await sendNotifyRequest(token);
    showResult(result, accountIndex, reqIndex);
  } catch (e) {
    console.log(`❌ 账号 ${accountIndex} 第 ${reqIndex} 次请求失败: ${e.message}`);
  }
}

async function sendNotifyRequest (token) {
  const url = `https://fc.kejiweixun.com/hero/setting`;

  for (let retry = 1; retry <= 3; retry++) {
    try {
      const res = await got.post(url, {
        headers: {
          'authorization': token,
          'xweb_xhr': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2640606) XWEB/14076',
          'Accept': '*/*',
          'Sec-Fetch-Site': 'cross-site',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Dest': 'empty',
          'Referer': 'https://servicewechat.com/wx125805c473dbb697/31/page-frame.html',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Content-Type': 'application/json',
        },
        json: {
          dkjs: 'U2FsdGVkX1/O8OV0at0rQqtgEoJ9Z/2yRNxKam/bMU8='
        },
        timeout: 10000,
      });

      return JSON.parse(res.body);
    } catch (e) {
      if (RETRY_CODES.includes(e.code) && retry < 3) {
        console.log(`↻ 请求失败，重试第 ${retry} 次`);
        await delay(1500);
        continue;
      }
      throw e;
    }
  }
}

function showResult (data, accountIndex, reqIndex) {
  if (!data) {
    console.log(`⚠️ 账号 ${accountIndex} 第 ${reqIndex} 次请求无返回数据`);
    return;
  }

  console.log(`✅ 账号 ${accountIndex} 第 ${reqIndex} 次请求响应:`);
  console.log(data);
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
