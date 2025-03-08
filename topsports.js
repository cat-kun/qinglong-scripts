/*
滔博运动自动签到（纯Cookie版）
环境变量格式：export topsportsCookie='cookie1\ncookie2'
*/

const $ = new Env('滔博签到');
const got = require('got');

// 环境变量配置
const ENV_NAME = 'topsportsCookie';
const COOKIE_LIST = process.env[ENV_NAME] ? process.env[ENV_NAME].split('\n').filter(c => c) : [];

// 主流程
async function main () {
  if (COOKIE_LIST.length === 0) {
    console.log(`❌ 请先设置环境变量 ${ENV_NAME}`);
    return;
  }

  console.log(`✅ 共找到 ${COOKIE_LIST.length} 个Cookie`);

  // 并行执行所有账号签到
  await Promise.all(COOKIE_LIST.map(async (cookie, index) => {
    await handleAccount(cookie, index + 1);
  }));
}

// 处理单个账号
async function handleAccount (cookie, index) {
  console.log(`\n======= 账号 ${index} 开始处理 =======`);
  try {
    const signResult = await dailySign(cookie);
    showResult(signResult, index);
  } catch (error) {
    console.log(`⚠️ 账号 ${index} 请求失败: ${error.message}`);
  }
}

// 签到核心逻辑
async function dailySign (cookie) {
  const errcodes = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN']; // 定义需要重试的错误码

  for (let retry = 1; retry <= 3; retry++) {
    try {
      const { body } = await got.post('https://m.topsports.com.cn/h5/act/signIn/doSign', {
        headers: {
          'brandCode': 'TS',
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
          'Content-Type': 'application/json'
        },
        json: {
          activityId: "0ae7d533258944bdae0aa23ce55925ec",
          brandCode: "TS"
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

// 处理签到结果
function showResult (data, index) {
  if (!data) {
    console.log(`❌ 账号 ${index} 无效响应`);
    return;
  }

  const baseInfo = [
    `${data.code === 1 ? '✅' : '❌'} 账号 ${index}`,
    `操作结果: ${data.bizMsg}`,
    `温馨提示: ${data.data?.signInTips || '无提示信息'}`
  ];

  // 处理积分奖励信息
  const rewards = data.data?.signInPrizeSendResultDTOList || [];
  const prizeInfo = rewards.map(item => {
    return `获得 ${item.prizeValue}${item.prizeName} (类型:${item.prizeType})`;
  });

  console.log([
    ...baseInfo,
    ...(rewards.length ? ['--- 奖励详情 ---', ...prizeInfo] : []),
    ''
  ].join('\n'));
}

// 环境类（青龙框架需要）
function Env (name) {
  return new class {
    constructor(name) {
      this.name = name;
      this.notifyMsgs = [];
    }
    log (msg, options = {}) {
      console.log(msg);
      if (options.notify) this.notifyMsgs.push(msg);
    }
    async sendNotify () {
      if (this.notifyMsgs.length > 0) {
        const notify = require('./sendNotify');
        await notify.sendNotify(this.name, this.notifyMsgs.join('\n'));
      }
    }
  }(name);
}

// 执行入口
main().catch(console.error);