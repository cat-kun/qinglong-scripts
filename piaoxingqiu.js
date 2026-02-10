/**
 * 票星球APP签到脚本
 * 环境变量格式：
 * - 每组参数用 @ 分隔：
 *   accessToken@userId@clientId@deviceToken@udid@merchantId(可选)@bizCode(可选)@ver(可选)
 * - 多个账号用 & 分隔
 * @example
 * export pxqParams='token1@userId1@clientId1@deviceToken1@udid1@6267a80eed218542786f1494@FHL_M@4.53.0&token2@userId2@clientId2@deviceToken2@udid2'
 */
/**
 * @class EnvClass
 * @description 青龙环境封装
 */
class EnvClass {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
    this.notifyMsgs = [];
  }

  /**
   * @param {string} msg
   * @param {{ notify?: boolean }} options
   * @returns {void}
   * @example
   * env.log('hello', { notify: true });
   */
  log(msg, options = {}) {
    console.log(msg);
    if (options.notify) this.notifyMsgs.push(msg);
  }

  /**
   * @returns {Promise<void>}
   * @throws {Error} 当发送通知失败时抛出错误
   * @example
   * await env.sendNotify();
   */
  async sendNotify() {
    if (this.notifyMsgs.length > 0) {
      const notify = require('./sendNotify');
      await notify.sendNotify(this.name, this.notifyMsgs.join('\n'));
    }
  }
}

/**
 * 创建环境实例
 * @param {string} name
 * @returns {EnvClass}
 * @example
 * const $ = new Env('票星球APP签到');
 */
function Env(name) {
  return new EnvClass(name);
}

const $ = new Env('票星球APP签到');
const got = require('got');

/**
 * @type {string}
 */
const ENV_NAME = 'pxqParams';

/**
 * @type {string[]}
 */
const ACCOUNT_LIST = process.env[ENV_NAME]
  ? process.env[ENV_NAME].split('&').filter(Boolean)
  : [];

/**
 * @type {string[]}
 */
const RETRY_CODES = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];

/**
 * @typedef {Object} AccountConfig
 * @property {string} accessToken
 * @property {string} userId
 * @property {string} clientId
 * @property {string} deviceToken
 * @property {string} udid
 * @property {string} merchantId
 * @property {string} bizCode
 * @property {string} ver
 * @property {string} src
 * @property {string} terminalSrc
 */

/**
 * 主入口
 * @returns {Promise<void>}
 * @throws {Error} 当请求失败时抛出错误
 * @example
 * await main();
 */
async function main() {
  if (ACCOUNT_LIST.length === 0) {
    console.log(`❌ 请先设置环境变量 ${ENV_NAME}`);
    return;
  }

  console.log(`✅ 共检测到 ${ACCOUNT_LIST.length} 个账号配置`);

  for (let i = 0; i < ACCOUNT_LIST.length; i++) {
    const account = parseAccount(ACCOUNT_LIST[i], i + 1);
    if (!account) {
      continue;
    }
    await handleAccount(account, i + 1);
  }
}

/**
 * 解析账号配置
 * @param {string} raw
 * @param {number} index
 * @returns {AccountConfig|null}
 * @example
 * const account = parseAccount('token@userId@clientId@deviceToken@udid', 1);
 */
function parseAccount(raw, index) {
  const parts = raw.split('@');
  const accessToken = parts[0];
  const userId = parts[1];
  const clientId = parts[2];
  const deviceToken = parts[3];
  const udid = parts[4];
  const merchantId = parts[5] || '6267a80eed218542786f1494';
  const bizCode = parts[6] || 'FHL_M';
  const ver = parts[7] || '4.53.0';

  if (!accessToken || !userId || !clientId || !deviceToken || !udid) {
    console.log(`⚠️ 账号 ${index} 参数不完整`);
    return null;
  }

  return {
    accessToken,
    userId,
    clientId,
    deviceToken,
    udid,
    merchantId,
    bizCode,
    ver,
    src: 'ios',
    terminalSrc: 'IOS',
  };
}

/**
 * 处理单个账号
 * @param {AccountConfig} account
 * @param {number} index
 * @returns {Promise<void>}
 * @throws {Error} 当签到请求失败时抛出错误
 * @example
 * await handleAccount(account, 1);
 */
async function handleAccount(account, index) {
  console.log(`\n======= 账号 ${index} 开始处理 =======`);
  try {
    const result = await registerClient(account);
    showResult(result, index);
  } catch (e) {
    console.log(`⚠️ 账号 ${index} 请求失败: ${e.message}`);
  }
}

/**
 * 调用注册设备接口作为签到
 * @param {AccountConfig} account
 * @returns {Promise<Object>}
 * @throws {Error} 当请求失败且不可重试时抛出错误
 * @example
 * const result = await registerClient(account);
 */
async function registerClient(account) {
  const url =
    'https://appapi.caiyicloud.com/cyy_gatewayapi/user/buyer/v5/registerClient';

  for (let retry = 1; retry <= 3; retry++) {
    try {
      const res = await got.post(url, {
        headers: {
          Accept: '*/*',
          'merchant-id': account.merchantId,
          src: account.src,
          ver: account.ver,
          udid: account.udid,
          'access-token': account.accessToken,
          'terminal-src': account.terminalSrc,
          'Content-Type': 'application/json',
          'Accept-Language': 'zh-Hans-CN;q=1',
          'Accept-Encoding': 'gzip, deflate, br',
          'User-Agent': 'piao xing qiu/4.53.0 (iPhone; iOS 16.1; Scale/3.00)',
          Connection: 'keep-alive',
        },
        json: {
          'terminal-src': account.terminalSrc,
          userId: account.userId,
          enabled: true,
          src: account.src,
          ver: account.ver,
          bizCode: account.bizCode,
          clientId: account.clientId,
          isSupportSession: '1',
          deviceToken: account.deviceToken,
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

/**
 * 输出结果
 * @param {Object} data
 * @param {number} index
 * @returns {void}
 * @example
 * showResult({ statusCode: 200, comments: '成功', data: true }, 1);
 */
function showResult(data, index) {
  if (!data) {
    console.log(`❌ 账号 ${index} 无效响应`);
    return;
  }

  const success = data.statusCode === 200 && data.data === true;
  const message = data.comments || data.message || '未知结果';

  console.log(
    [
      `${success ? '✅' : '❌'} 账号 ${index}`,
      `操作结果: ${message}`,
      `返回状态: ${data.statusCode ?? '未知'}`,
    ].join('\n'),
  );
}

/**
 * 延迟
 * @param {number} ms
 * @returns {Promise<void>}
 * @example
 * await delay(1000);
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
