/*
南方航空签到脚本（Cookie版）
环境变量格式：export csairCookie='cookie1\ncookie2'

@description 南方航空活动签到脚本类
@author 自动生成
@version 1.0.0
@example
// 环境变量设置示例
export csairCookie='TOKEN=xxx; channel=csair; openid=xxx; unionId=xxx; ...'
*/

const $ = new Env('南航签到');
const got = require('got');

/**
 * 环境变量名称
 * @type {string}
 * @example
 * const name = ENV_NAME;
 */
const ENV_NAME = 'csairCookie';

/**
 * Cookie列表
 * @type {string[]}
 * @example
 * const list = COOKIE_LIST;
 */
const COOKIE_LIST = process.env[ENV_NAME]
  ? process.env[ENV_NAME].split('\n').filter((item) => item)
  : [];

/**
 * 南航签到客户端
 * @class
 * @example
 * const client = new CsairSignClient();
 */
class CsairSignClient {
  /**
   * 创建签到客户端
   * @param {string} cookie - Cookie字符串
   * @example
   * const client = new CsairSignClient('TOKEN=xxx; channel=csair; ...');
   */
  constructor(cookie) {
    /**
     * Cookie字符串
     * @type {string}
     */
    this.cookie = cookie;
  }

  /**
   * 执行签到请求
   * @returns {Promise<Object>} 返回签到结果
   * @throws {Error} 请求失败时抛出错误
   * @example
   * const result = await client.sign();
   */
  async sign() {
    const { body } = await got.post(
      'https://wxapi.csair.com/marketing-tools/activity/join?type=APPTYPE&chanel=ss&lang=zh',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2641711) XWEB/18684 miniProgram/wx729238547ac7a14c',
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          Origin: 'https://wxapi.csair.com',
          Referer: 'https://wxapi.csair.com/h5/sign/',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Dest': 'empty',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          Priority: 'u=1, i',
          Cookie: this.cookie,
        },
        json: {
          activityType: 'sign',
          channel: 'mini',
          entrance: 1,
        },
        timeout: 10000,
      },
    );

    return JSON.parse(body);
  }
}

/**
 * 主流程函数
 * @returns {Promise<void>} 无返回值
 * @throws {Error} 当环境变量未设置或请求失败时抛出错误
 * @example
 * await main();
 */
async function main() {
  if (COOKIE_LIST.length === 0) {
    console.log(`❌ 请先设置环境变量 ${ENV_NAME}`);
    return;
  }

  console.log(`✅ 共找到 ${COOKIE_LIST.length} 个Cookie`);

  await Promise.all(
    COOKIE_LIST.map(async (cookie, index) => {
      await handleAccount(cookie, index + 1);
    }),
  );
}

/**
 * 处理单个账号签到
 * @param {string} cookie - Cookie字符串
 * @param {number} index - 账号索引
 * @returns {Promise<void>} 无返回值
 * @throws {Error} 请求失败时抛出错误
 * @example
 * await handleAccount('TOKEN=xxx; channel=csair; ...', 1);
 */
async function handleAccount(cookie, index) {
  console.log(`\n======= 账号 ${index} 开始处理 =======`);
  const errcodes = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];
  showCookieHint(cookie, index);
  const client = new CsairSignClient(cookie);

  for (let retry = 1; retry <= 3; retry++) {
    try {
      const result = await client.sign();
      showResult(result, index);
      return;
    } catch (error) {
      if (errcodes.includes(error.code) && retry < 3) {
        console.log(`↻ 第${retry}次重试中...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      console.log(`⚠️ 账号 ${index} 请求失败: ${error.message}`);
      return;
    }
  }
}

/**
 * 解析Cookie并输出关键登录态提示
 * @param {string} cookie - 原始Cookie
 * @param {number} index - 账号索引
 * @returns {void}
 */
function showCookieHint(cookie, index) {
  const token = getCookieValue(cookie, 'TOKEN');
  if (!token) {
    console.log(`⚠️ 账号 ${index} Cookie中未找到 TOKEN，可能无法通过登录校验`);
    return;
  }

  const expireTs = extractTimestampFromToken(token);
  if (!expireTs) {
    console.log(`ℹ️ 账号 ${index} 未能解析 TOKEN 过期时间，将直接尝试签到`);
    return;
  }

  const expireMs = expireTs * 1000;
  const now = Date.now();
  const expireText = new Date(expireMs).toLocaleString('zh-CN', {
    hour12: false,
  });
  if (expireMs <= now) {
    console.log(
      `⚠️ 账号 ${index} TOKEN已过期（${expireText}），请重新抓取最新Cookie`,
    );
  } else {
    const leftMin = Math.floor((expireMs - now) / 60000);
    console.log(
      `ℹ️ 账号 ${index} TOKEN有效期至 ${expireText}（剩余约${leftMin}分钟）`,
    );
  }
}

/**
 * 从Cookie字符串中提取指定key
 * @param {string} cookie - 原始Cookie
 * @param {string} key - Cookie键
 * @returns {string}
 */
function getCookieValue(cookie, key) {
  if (!cookie || !key) return '';
  const list = cookie.split(';');
  for (const item of list) {
    const i = item.indexOf('=');
    if (i === -1) continue;
    const k = item.slice(0, i).trim();
    if (k !== key) continue;
    return item.slice(i + 1).trim();
  }
  return '';
}

/**
 * 从TOKEN中提取可识别的13位/10位时间戳
 * @param {string} token - TOKEN字符串
 * @returns {number|null}
 */
function extractTimestampFromToken(token) {
  try {
    // TOKEN通常包含一段base64片段，解码后可能含Unix时间戳
    const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(normalized, 'base64').toString('utf8');
    const candidates = decoded.match(/\d{10,13}/g) || [];
    for (const raw of candidates) {
      const ts = Number(raw.length === 13 ? raw.slice(0, 10) : raw);
      if (ts >= 1600000000 && ts <= 2200000000) {
        return ts;
      }
    }
  } catch (e) {
    // ignore
  }

  // 兜底：直接从token本体中尝试提取
  const fallback = token.match(/\d{10,13}/g) || [];
  for (const raw of fallback) {
    const ts = Number(raw.length === 13 ? raw.slice(0, 10) : raw);
    if (ts >= 1600000000 && ts <= 2200000000) {
      return ts;
    }
  }
  return null;
}

/**
 * 显示签到结果
 * @param {Object} data - 返回的数据
 * @param {number} index - 账号索引
 * @returns {void} 无返回值
 * @example
 * showResult({ code: 0, msg: 'ok', success: true }, 1);
 */
function showResult(data, index) {
  if (!data) {
    console.log(`❌ 账号 ${index} 无效响应`);
    return;
  }

  const success =
    data.code === 0 || data.success === true || data.respCode === '0000';
  const message = data.msg || data.message || data.respMsg || '未知结果';
  const loginFailed =
    /(登录信息失败|登录信息|未登录|认证失败|鉴权失败|token)/i.test(message);

  const baseInfo = [
    `${success ? '✅' : '❌'} 账号 ${index}`,
    `操作结果: ${message}`,
    `签到状态: ${success ? '成功' : '失败'}`,
    ...(success || !loginFailed
      ? []
      : [
          '诊断建议: 当前Cookie登录态疑似过期，请重新抓包更新 TOKEN/cs1246643sso',
        ]),
  ];

  const extraInfo = [];
  if (data.data && typeof data.data === 'object') {
    if (data.data.result !== undefined) {
      extraInfo.push(`奖励提示: ${data.data.result}`);
    }
    if (data.data.award_num !== undefined) {
      extraInfo.push(`获得奖励数量: ${data.data.award_num}`);
    }
    if (data.data.score !== undefined) {
      extraInfo.push(`当前积分: ${data.data.score}`);
    }
  }

  console.log(
    [
      ...baseInfo,
      ...(extraInfo.length ? ['--- 奖励详情 ---', ...extraInfo] : []),
      '',
    ].join('\n'),
  );
}

/**
 * 环境类
 * @description 提供青龙面板所需的环境支持
 * @param {string} name - 脚本名称
 * @returns {Object} 环境对象实例
 * @example
 * const $ = new Env('南航签到');
 */
function Env(name) {
  return new (class {
    /**
     * 构造函数
     * @param {string} name - 环境名称
     */
    constructor(name) {
      this.name = name;
      this.notifyMsgs = [];
    }

    /**
     * 日志输出方法
     * @param {string} msg - 日志消息
     * @param {Object} options - 选项配置
     * @param {boolean} options.notify - 是否发送通知
     * @returns {void} 无返回值
     */
    log(msg, options = {}) {
      console.log(msg);
      if (options.notify) this.notifyMsgs.push(msg);
    }

    /**
     * 发送通知方法
     * @returns {Promise<void>} 无返回值
     * @throws {Error} 当通知发送失败时抛出错误
     */
    async sendNotify() {
      if (this.notifyMsgs.length > 0) {
        const notify = require('./sendNotify');
        await notify.sendNotify(this.name, this.notifyMsgs.join('\n'));
      }
    }
  })(name);
}

main().catch(console.error);
