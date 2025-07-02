/**
 * 易票哒小程序余票通知数
 * 环境变量格式：
 * export ticketddNotifyParams='openId1@templateId1@token1@...&openId2@templateId2@token2'
 */


const $ = new Env('易票哒小程序余票通知数');
const got = require('got');

// 环境变量名
const ENV_NAME = 'ticketddNotifyParams';
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
    const openId = parts[0];
    const templateId = parts[1];
    const count = parseInt(parts[2]) || 1;

    if (!openId || !templateId) {
      console.log(`⚠️ 第 ${i + 1} 个账号参数不完整`);
      continue;
    }

    console.log(`\n===> 开始处理账号 ${i + 1}，请求次数: ${count}`);
    for (let j = 0; j < count; j++) {
      console.log(`➡️ 第 ${j + 1} 次请求`);
      await handleAccount(openId, templateId, i + 1, j + 1);
      await delay(1000); // 每次请求之间间隔1秒，防止触发限流
    }
  }
}

async function handleAccount (openId, templateId, accountIndex, reqIndex) {
  try {
    const result = await sendNotifyRequest(openId, templateId);
    showResult(result, accountIndex, reqIndex);
  } catch (e) {
    console.log(`❌ 账号 ${accountIndex} 第 ${reqIndex} 次请求失败: ${e.message}`);
  }
}

async function sendNotifyRequest (openId, templateId) {
  const url = `https://m.ticketdd.top/sub/addWxNotify?openId=${openId}&templateId=${templateId}`;

  for (let retry = 1; retry <= 3; retry++) {
    try {
      const res = await got.post(url, {
        headers: {
          'ts': Date.now().toString(),
          'nonce': Math.random().toString(36).substring(2, 16),
          'on-version': '1.0.11',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2640606) XWEB/14076',
          'Accept': 'application/json',
          'wx-version': 'release',
          'xweb_xhr': '1',
          'app-id': 'wxba7592991b55ef23',
          'oid': 'b0hOaWs3ZVJXZ1R5T3lKb1JCdkFld0JsU0ZrTQ==',
          'Referer': 'https://servicewechat.com/wxba7592991b55ef23/9/page-frame.html',
          'Content-Type': 'application/json',
        },
        json: {},
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

// 模拟青龙通知类
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

