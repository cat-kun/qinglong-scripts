/*
台铃app自动签到脚本（纯Authorization版）
环境变量格式：export tailgddAuth='auth1\nauth2'

@description 台铃app签到脚本类
@author 自动生成
@version 1.0.0
@example
// 环境变量设置示例
export tailgddAuth='c3fwod5KRO6B%2FPX7o6YOu81xVzPu24uGlaH5jEOudIG...'
*/

const $ = new Env('台铃签到');
const got = require('got');

// 环境变量配置
const ENV_NAME = 'tailgddAuth';
const AUTH_LIST = process.env[ENV_NAME] ? process.env[ENV_NAME].split('\n').filter(a => a) : [];

/**
 * 主流程函数
 * @description 执行所有账号的签到任务
 * @returns {Promise<void>} 无返回值
 * @throws {Error} 当环境变量未设置时抛出错误
 * @example
 * await main();
 */
async function main() {
  if (AUTH_LIST.length === 0) {
    console.log(`❌ 请先设置环境变量 ${ENV_NAME}`);
    return;
  }

  console.log(`✅ 共找到 ${AUTH_LIST.length} 个Authorization`);

  // 并行执行所有账号签到
  await Promise.all(AUTH_LIST.map(async (auth, index) => {
    await handleAccount(auth, index + 1);
  }));
}

/**
 * 处理单个账号签到
 * @description 处理单个账号的签到流程，包含错误处理
 * @param {string} auth - Authorization认证信息
 * @param {number} index - 账号索引（从1开始）
 * @returns {Promise<void>} 无返回值
 * @throws {Error} 当请求失败时抛出错误
 * @example
 * await handleAccount('auth_token_here', 1);
 */
async function handleAccount(auth, index) {
  console.log(`\n======= 账号 ${index} 开始处理 =======`);
  try {
    const signResult = await dailySign(auth);
    showResult(signResult, index);
  } catch (error) {
    console.log(`⚠️ 账号 ${index} 请求失败: ${error.message}`);
  }
}

/**
 * 执行每日签到
 * @description 向台铃服务器发送签到请求，支持重试机制
 * @param {string} auth - Authorization认证信息
 * @returns {Promise<Object>} 签到结果对象
 * @throws {Error} 当所有重试都失败时抛出错误
 * @example
 * const result = await dailySign('auth_token_here');
 * // 返回: {"code":0,"data":{"award_num":1},"msg":"操作成功","success":true}
 */
async function dailySign(auth) {
  const errcodes = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN']; // 定义需要重试的错误码
  const today = new Date().toISOString().split('T')[0]; // 获取今天日期 YYYY-MM-DD

  for (let retry = 1; retry <= 3; retry++) {
    try {
      const { body } = await got.post('https://www.tailgdd.com/v1/api/shop/app/integral/sign/saveIntegralSignIn', {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': auth,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json;charset=UTF-8',
          'Origin': 'https://www.tailgdd.com',
          'Referer': 'https://www.tailgdd.com/travel/tailg-shop-h5/',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
          'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        },
        json: {
          signDate: today
        },
        timeout: 10000 // 10秒超时
      });

      return JSON.parse(body);
    } catch (error) {
      if (errcodes.includes(error.code) && retry < 3) {
        console.log(`↻ 第${retry}次重试中...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw error;
    }
  }
}

/**
 * 显示签到结果
 * @description 格式化并显示签到结果信息
 * @param {Object} data - 签到返回的数据对象
 * @param {number} data.code - 响应状态码（0表示成功）
 * @param {string} data.msg - 响应消息
 * @param {boolean} data.success - 操作是否成功
 * @param {Object} data.data - 签到数据
 * @param {number} data.data.award_num - 获得的奖励数量
 * @param {number} index - 账号索引
 * @returns {void} 无返回值
 * @example
 * showResult({"code":0,"data":{"award_num":1},"msg":"操作成功","success":true}, 1);
 */
function showResult(data, index) {
  if (!data) {
    console.log(`❌ 账号 ${index} 无效响应`);
    return;
  }

  const baseInfo = [
    `${data.code === 0 && data.success ? '✅' : '❌'} 账号 ${index}`,
    `操作结果: ${data.msg || '未知结果'}`,
    `签到状态: ${data.success ? '成功' : '失败'}`
  ];

  // 处理奖励信息
  const awardInfo = [];
  if (data.data && data.data.award_num !== undefined) {
    awardInfo.push(`获得奖励数量: ${data.data.award_num}`);
  }

  console.log([
    ...baseInfo,
    ...(awardInfo.length ? ['--- 奖励详情 ---', ...awardInfo] : []),
    ''
  ].join('\n'));
}

/**
 * 环境类（青龙框架需要）
 * @description 提供青龙面板所需的环境支持
 * @param {string} name - 脚本名称
 * @returns {Object} 环境对象实例
 * @example
 * const $ = new Env('台铃签到');
 */
function Env(name) {
  return new class {
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
     * @returns {void}
     */
    log(msg, options = {}) {
      console.log(msg);
      if (options.notify) this.notifyMsgs.push(msg);
    }

    /**
     * 发送通知方法
     * @description 发送累积的通知消息
     * @returns {Promise<void>} 无返回值
     * @throws {Error} 当通知发送失败时抛出错误
     */
    async sendNotify() {
      if (this.notifyMsgs.length > 0) {
        const notify = require('./sendNotify');
        await notify.sendNotify(this.name, this.notifyMsgs.join('\n'));
      }
    }
  }(name);
}

// 执行入口
main().catch(console.error);