/*
美团 TopCube 自动签到（纯 Cookie 版）
环境变量格式：export meituanCookie='cookie1\ncookie2'
*/

const got = require('got');

// 环境变量配置
const ENV_NAME = 'meituanCookie';
const COOKIE_LIST = process.env[ENV_NAME]
  ? process.env[ENV_NAME].split('\n').filter(c => c)
  : [];

if (COOKIE_LIST.length === 0) {
  console.error(`❌ 请先设置环境变量 ${ENV_NAME}`);
  process.exit(1);
}

console.log(`✅ 共检测到 ${COOKIE_LIST.length} 个 Cookie，开始签到…`);

// 并行处理所有账号
(async () => {
  await Promise.all(
    COOKIE_LIST.map((cookie, idx) => handleAccount(cookie, idx + 1))
  );
})();

// 处理单个账号
async function handleAccount (cookie, index) {
  console.log(`\n======= 账号 ${index} 开始 =======`);
  try {
    const res = await receiveAndOpUserTask(cookie);
    printResult(res, index);
  } catch (err) {
    console.error(`⚠️ 账号 ${index} 签到失败：`, err.message);
  }
}

// 签到核心逻辑
async function receiveAndOpUserTask (cookie) {
  const BASE_URL = 'https://cube.meituan.com/topcube/api/toc/taskCenter/receiveAndOpUserTask';
  const params = {
    k: 'member_1',
    csecpkgname: 'com.meituan.imeituan',
    csecplatform: '2',
    csecversion: '1.0.15',
    csecversionname: '12.36.403'
  };
  const url = `${BASE_URL}?${new URLSearchParams(params).toString()}`;

  // 需要重试的错误码
  const RETRY_CODES = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];

  // 固定请求体——将上次抓包拿到的 body 原样放进这里
  const body = {
    uuid: "0000000000000E2E1C7B6EB024B1CACDCDD2812D321B2A163840111479649831",
    sourceActivityType: 3,
    eventType: 1,
    userType: "MT",
    taskNo: "1_63813266_1692_5",
    appType: 1,
    needReachTask: false,
    userId: 63813266,
    riskForm: "eyJmaW5nZXJwcmludCI6ImkySEtwT21zaXJEUGF2ZWxWZlFCWkZkZlBCaHl1cjJzb1ZWUU5XSVdGUjQzbG5vVFJJSzZmMWdHakxvd3FqenJEM3cvNGhldDVzQlI2dWhQejVINjV4VDNyTmJQSU5aMzJuVmIwdng2TCtLd1UrNmxFWTFwY1JURWpNSHBPNlg1MVJoc2pDOHdoemd0b0ZDR3p0citVcmFlSkZ6eW1IMkhOSEpBQTV3WEhUNnc4K0RzTnBueWppWDhDTFpxM21rYm5qNTB5Skw2VEdwNmtVTW5rbFFFOFloZjROcCtzV29iajY5NkJ6YXVyQXZqU1pZYXJGalVGUTU5Wlp4MThCeXZnQXFWSm1UOWxoc3EzN1NKREVqKzRPUDVYOU0zaWNzdWhNYm1SV01Cb084SUp3cFY3a2V2Z1R6VG1kaXExOThnTE5TZStqeXRyamhjb1BRN2hNOFNsM3VJNk5nellZaGxXaFBXbmJ4SDFId05uaWJaVE1ORXN3NW9ORVlrL3grb3p1d2JTbjNmQlQzTzR2QmtTU1hyZStJdU9MeTlyRW1uZ09mWUpMenZvZjRlY1k0M2RtakVBbzB2dUF2djN0ZmNYNWJVS1EyTnBLV3RMcW0wZUdHZzU5blBSeXdMOUI1eW9iVVh3ejk4Ry80RkR2R2I5akQ3Z1YwOHBBUWRGLzlOd2ZtY3loeEdneDVmbkd3RnlkNk9QZC9BN2JPYjFpSFFpTFdlUndCQ0VjWHc4Y0VMWlF6V3ZoRWhia1hXbWEreXc5MnVLb2VDdUtodkFZejZiTFRTQWFTcG9lc2tFaEFpQjhpdHc1d0w2c2tlZndFSGR0d3B5V2p0Q2RJUlY3U0VjbTBUVTRlZHBCUUtUbS93RWpLY3RsQzFPVHc2cmY1VzZSa3Zqcm5UcVd1Y3ZKaVlXYnZ2N0I2SnJqeldNSmdPK0NzczVrdWJUQTlORUZCdzRnRTlOZHBocHNkdzZvempETWFQWjNtZGNsWjRuaGZ0RExXSUlveTRvK3ZKdmFXdDBBVGFKK1FqRjVQT1BqVlNnTnlyZVdVQlRsMGZ2SXZJUlZ2Rzlqd3htWWRxaExIZ2hxTWwyOTlWc1E5bHR6LzNaV0kwaUxrQjkxRG0yQ0pDM1NWZEJOMkE3bVVXaFhoTEpDSVY0dE5DUXhEN01IU2J6Wm1sYUcwZktiQnpEQ2I1ZTQ0WlhMdWFCclBWYXpzQklTaWd2TE9EOEZiQ3dmRlUwTlFlTXhOd1lYUjBwclc2NXBqc3NaSXJrTm1NbExNbmozY0pUMy8xejd4b1owNytZWUVUVGNxMXMrOXkwbTAyRitIY0JsNy9XczVMWlpBajZ3bTErMml3blFpN3RuR0NKdi94RTZOZUd3MWlEMkpmZkpVY3NoQjdka3J5a25NeXU5QVY5Ti9yQ1BZWFp3WmU2K2xPZ281Vm5lVFk1NE1TQ0UzMFkxV0U4NmVUOUY4dy95Ni8yaTFZSGVST3BmOER1MjFxWmJVOWM1aElhQU42TWFUSEd2UVNGa2VCMkdtLy8xWlA5R2FiUWIxeHUxUW5mMmhZUXdHSStXNmhGL2czVFR5TlVoRUFyMzh6ZGNOKzJsUVZyVlVQZWhOUUFzYmE1cSt4QTVBRVNzMlpMaUp2UjJMVkZxVzV0WWg5cE9HSFZLOTVEVjRBR2dDL01WYWV5MUdLK0s4eHlHWjlLdjlhVTJkMUxvNW1aTmJrUmpzdFpYSW1iZ0c4T1o1UU1Caks3R2gwNjF6dTFlV1JRZVdnQzB3RU1PSFErUi93U3BheG9UQXp3L052ay80Z3l2c2NpdXVZdjIzV1FnbUdDc0F1dGJBT0tBWkc4ams9IiwidXNlcklkIjo2MzgxMzI2NiwidXVpZCI6IjAwMDAwMDAwMDAwMDBFMkUxQzdCNkVCMDI0QjFDQUNEQ0REMjgxMkQzMjFCMkExNjM4NDAxMTE0Nzk2NDk4MzEiLCJhcHBpZCI6bnVsbCwiZXhwb0lkIjpudWxsLCJ2ZXJzaW9uIjoiMTIuMzYuNDAzIiwiYXBwbGV0c0ZpbmdlcnByaW50IjpudWxsLCJwbGF0Zm9ybSI6NjB9",
    sourceActivityId: 1,
    lat: 23.114042392947411,
    needReportEvent: true,
    mini_program_token: "AgE7H9Fbv4mn0V-s6D-FPMXbO5_o2ARalRBqDivjiZx-EuyIy-Z9IwnkTexcOMwDRR13PBtEAUm76QAAAABKKwAAbdXfwOMjEPOHbxiuAHlbIN6Hdxrp0WuplfcnyyUqiA5R7C8H2NkHU73gYhwdeFvw",
    taskKey: "d36b6df3c1",
    needReceiveTask: true,
    cityId: 20,
    lng: 113.32926325341568
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await got.post(url, {
        headers: {
          'Content-Type': 'application/json',
          // 把 Cookie 原样传给美团
          'Cookie': cookie,
          // 根据抓包也可能需要的自定义头
          'token': body.mini_program_token,
          'yodaReady': 'native',
          'csecuserid': String(body.userId),
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) ' +
            'AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
        },
        json: body,
        timeout: 10000
      });

      return JSON.parse(response.body);
    } catch (err) {
      if (RETRY_CODES.includes(err.code) && attempt < 3) {
        console.log(`↻ 第 ${attempt} 次重试…`);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        throw err;
      }
    }
  }
}

// 打印结果
function printResult (data, index) {
  if (!data) {
    console.log(`❌ 账号 ${index} 无响应`);
    return;
  }
  console.log([
    data.code === 0 ? '✅ 签到成功' : '❌ 签到失败',
    `msg: ${data.msg || data.bizMsg || JSON.stringify(data)}`,
    ''
  ].join('\n'));
}
