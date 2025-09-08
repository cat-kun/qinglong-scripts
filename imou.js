/**
 * 乐橙APP签到脚本
 * 环境变量格式：
 * - 每组参数用 @ 分隔：x-pcs-signature值@x-pcs-nonce值@x-pcs-client-ua值@x-pcs-username值
 * - 多个账号用 & 分隔
 * export imouParams='signature1@nonce1@clientua1@username1&signature2@nonce2@clientua2@username2'
 *
 * 抓包方法：
 * 1. 打开乐橙APP
 * 2. 抓取 https://app-gz-hw.imou.com/pcs/v1/points.sign.SignInAuto 请求
 * 3. 复制请求头中的 x-pcs-signature、x-pcs-nonce、x-pcs-client-ua、x-pcs-username 值
 */

const $ = new Env('乐橙APP签到');
const got = require('got');

const ENV_NAME = 'imouParams';
const ACCOUNT_LIST = process.env[ENV_NAME]
  ? process.env[ENV_NAME].split('&').filter(Boolean)
  : [];

const RETRY_CODES = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];

/**
 * 主函数 - 处理所有账号的签到
 */
async function main() {
  if (ACCOUNT_LIST.length === 0) {
    console.log(`❌ 请设置环境变量 ${ENV_NAME}`);
    console.log('格式: export imouParams="signature值@nonce值@clientua值@username值&signature值2@nonce值2@clientua值2@username值2"');
    return;
  }

  console.log(`🔍 共检测到 ${ACCOUNT_LIST.length} 个账号配置`);

  for (let i = 0; i < ACCOUNT_LIST.length; i++) {
    const parts = ACCOUNT_LIST[i].split('@');
    const signature = parts[0];
    const nonce = parts[1];
    const clientUa = parts[2];
    const username = parts[3];

    if (!signature || !nonce || !clientUa || !username) {
      console.log(`⚠️ 第 ${i + 1} 个账号参数不完整，需要 signature@nonce@clientua@username 格式`);
      continue;
    }

    console.log(`\n===> 开始处理账号 ${i + 1}`);
    await handleAccount(signature, nonce, clientUa, username, i + 1);

    // 账号间隔时间
    if (i < ACCOUNT_LIST.length - 1) {
      await delay(2000);
    }
  }
}

/**
 * 处理单个账号的签到
 * @param {string} signature - x-pcs-signature值
 * @param {string} nonce - x-pcs-nonce值
 * @param {string} clientUa - x-pcs-client-ua值
 * @param {string} username - x-pcs-username值
 * @param {number} accountIndex - 账号索引
 */
async function handleAccount(signature, nonce, clientUa, username, accountIndex) {
  try {
    const result = await sendSignRequest(signature, nonce, clientUa, username);
    showResult(result, accountIndex);
  } catch (e) {
    console.log(`❌ 账号 ${accountIndex} 签到失败: ${e.message}`);
  }
}

/**
 * 发送签到请求
 * @param {string} signature - x-pcs-signature值
 * @param {string} nonce - x-pcs-nonce值
 * @param {string} clientUa - x-pcs-client-ua值
 * @param {string} username - x-pcs-username值
 * @returns {Promise<Object>} 请求结果
 */
async function sendSignRequest(signature, nonce, clientUa, username) {
  const url = 'https://app-gz-hw.imou.com/pcs/v1/points.sign.SignInAuto';
  const currentDate = new Date().toISOString().replace(/\.\d+/, '');

  for (let retry = 1; retry <= 3; retry++) {
    try {
      const res = await got.post(url, {
        headers: {
          'Host': 'app-gz-hw.imou.com',
          'x-pcs-date': currentDate,
          'Accept': 'application/json, text/plain, */*',
          'x-pcs-signature': signature,
          'content-md5': 'Odw3OaFlWAlWzvmcB+wsgQ==',
          'rn-version': '6.0.12.1',
          'x-pcs-nonce': nonce,
          'x-pcs-client-ua': clientUa,
          'x-pcs-username': username,
          'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Content-Type': 'application/json; charset=UTF-8',
          'User-Agent': 'LCIphoneAdhocIP/2025.0828.2114 CFNetwork/3826.400.120 Darwin/24.3.0',
          'Connection': 'keep-alive',
          'x-pcs-apiver': '3.11.0'
        },
        body: JSON.stringify({"data":{}}),
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

/**
 * 显示签到结果
 * @param {Object} data - 签到响应数据
 * @param {number} accountIndex - 账号索引
 */
function showResult(data, accountIndex) {
  if (!data) {
    console.log(`⚠️ 账号 ${accountIndex} 签到无返回数据`);
    return;
  }

  console.log(`✅ 账号 ${accountIndex} 签到响应:`);
  console.log(`状态码: ${data.statusCode}`);

  if (data.body) {
    console.log(`响应数据: ${data.body}`);

    try {
      const jsonData = JSON.parse(data.body);
      if (jsonData.code === 10000 && jsonData.data && jsonData.data.signInStatus) {
        console.log(`🎉 账号 ${accountIndex} 签到成功，获得 ${jsonData.data.points} 积分`);
        console.log(`📅 已连续签到 ${jsonData.data.keepSignInDays} 天`);
      } else if (jsonData.code === 11013) {
        console.log(`⚠️ 账号 ${accountIndex} 今日已签到`);
      } else {
        console.log(`⚠️ 账号 ${accountIndex} 签到异常，返回码: ${jsonData.code}`);
      }
    } catch (e) {
      console.log(`⚠️ 账号 ${accountIndex} 解析响应数据失败: ${e.message}`);
    }
  }
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 青龙通知类封装（可配合 sendNotify.js）
function Env(name) {
  return new (class {
    constructor(name) {
      this.name = name;
      this.notifyMsgs = [];
    }
    log(msg, opt = {}) {
      console.log(msg);
      if (opt.notify) this.notifyMsgs.push(msg);
    }
    async sendNotify() {
      if (this.notifyMsgs.length > 0) {
        const notify = require('./sendNotify');
        await notify.sendNotify(this.name, this.notifyMsgs.join('\n'));
      }
    }
  })(name);
}

// 入口
main().catch(console.error);