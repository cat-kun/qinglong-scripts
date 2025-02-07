/*
滔博签到
以下都以青龙或nodejs环境为准

变量支持账号密码，多账号用\n分割
单账号：export topsportsCookie = '账号#密码'
多账号：export topsportsCookie = '账号1#密码\n账号2#密码'

下面一行是建议定时,青龙拉库会自动读取
cron: 0 0 * * *
*/
/*
const和let的区别:
用const定义的变量以后不能再更改
用let定义的变量可以改
进阶内容: const 对象本身不可更改,但是对象里面的属性可以改,与指针有关
*/

const $ = new Env('滔博签到'); //青龙拉库会把 new Env('qwerty') 里面的名字qwerty作为定时任务名
const got = require('got'); //青龙发包依赖

const env_name = 'topsportsCookie'; //环境变量名字
const env = process.env[env_name] || ''; //或 process.env.zippoCookie, node读取变量方法. 后面的 || 表示如果前面结果为false或者空字符串或者null或者undifined, 就取后面的值

// 主函数入口，负责执行签到任务
async function main () {
  if (env == '') {
    console.log(`没有填写变量: ${env_name}`);
    return;
  }

  // 分割多账号的Cookie信息，支持用换行或&分隔
  let user_ck = env.includes('\n') ? env.split('\n') : env.split('&');
  let index = 1; // 用于给每个账号分配编号

  // 遍历每个账号
  for (let ck of user_ck) {
    if (!ck) continue; // 跳过空行

    // 获取账号和密码
    const account = ck.split('#');
    let user = { index, cookie: account[0] }; // 保存用户信息
    index++; // 增加账号序号

    // 执行当前账号的任务
    await userTask(user);
  }
}

// 单个用户任务，包括签到
async function userTask (user) {
  console.log(`\n============= 账号[${user.index}]开始任务 =============`);
  await signin(user); // 调用签到函数
}

// 获取请求配置的函数，动态生成请求头和请求体
function getRequestOptions (user) {
  return {
    method: 'POST',
    url: 'https://m.topsports.com.cn/h5/act/signIn/doSign',
    headers: {
      'brandCode': 'TS',
      'Cookie': user.cookie, // 使用当前用户的Cookie
      'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Host': 'm.topsports.com.cn',
      'Connection': 'keep-alive',
    },
    body: JSON.stringify({
      "activityId": "0ae7d533258944bdae0aa23ce55925ec", // 活动ID
      "brandCode": "TS" // 品牌代码
    })
  };
}

// 签到函数，负责执行每个用户的签到操作
async function signin (user) {
  try {
    // 获取请求配置
    const options = getRequestOptions(user);
    // 执行请求
    const { result } = await request(options);

    // 根据签到结果输出不同的提示
    if (result?.code === 1) {
      console.log(`账号[${user.index}]签到状态：${result?.bizMsg}`);
    } else {
      console.log(`账号[${user.index}]签到状态：[${result?.code}]: ${result?.bizMsg}`);
    }
  } catch (e) {
    // 捕获并输出错误信息
    console.error(`账号[${user.index}]签到出错:`, e);
  }
}

// 封装请求函数，支持重试机制
async function request (opt) {
  const DEFAULT_RETRY = 3; // 默认重试次数
  let resp = null;
  let count = 0;

  // 重试机制
  while (count++ < DEFAULT_RETRY) {
    try {
      const errcodes = ['ECONNRESET', 'EADDRINUSE', 'ENOTFOUND', 'EAI_AGAIN']; // 需要重试的错误码
      const response = await got(opt); // 发起请求
      resp = response;
      break;
    } catch (err) {
      // 捕获请求错误并判断是否需要重试
      if (err.name === 'TimeoutError') {
        console.log(`[${opt.url}] 请求超时(${err.code})，重试第${count}次`);
      } else if (errcodes.includes(err.code)) {
        console.log(`[${opt.url}] 请求错误(${err.code})，重试第${count}次`);
      } else {
        console.log(`[${opt.url}] 请求错误(${err.message})`);
        break;
      }
    }
  }

  // 获取响应的状态码和body
  const { statusCode = -1, body = null } = resp;
  let parsedBody = null;
  // 尝试解析响应体
  if (body) {
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      console.log('解析响应体失败:', e);
    }
  }

  // 返回响应结果
  return { statusCode, result: parsedBody };
}

// 调用主函数
main();

function Env (name) {
  return new class {
    constructor(name) {
      this.name = name;
      this.startTime = Date.now();
      this.log(`[${this.name}]开始运行\n`, { time: true });
      this.notifyStr = [];
      this.notifyFlag = true;
      this.userIdx = 0;
      this.userList = [];
      this.userCount = 0;
    }
    log (msg, options = {}) {
      let opt = { console: true };
      Object.assign(opt, options);
      if (opt.time) {
        let fmt = opt.fmt || 'hh:mm:ss';
        msg = `[${this.time(fmt)}]` + msg;
      }
      if (opt.notify) this.notifyStr.push(msg);
      if (opt.console) console.log(msg);
    }
    read_env (Class) {
      let envStrList = ckNames.map(x => process.env[x]);
      for (let env_str of envStrList.filter(x => !!x)) {
        let sp = envSplitor.filter(x => env_str.includes(x));
        let splitor = sp.length > 0 ? sp[0] : envSplitor[0];
        for (let ck of env_str.split(splitor).filter(x => !!x)) {
          this.userList.push(new Class(ck));
        }
      }
      this.userCount = this.userList.length;
      if (!this.userCount) {
        this.log(`未找到变量，请检查变量${ckNames.map(x => '[' + x + ']').join('或')}`, { notify: true });
        return false;
      }
      this.log(`共找到${this.userCount}个账号`);
      return true;
    }
    async threads (taskName, conf, opt = {}) {
      while (conf.idx < $.userList.length) {
        let user = $.userList[conf.idx++];
        if (!user.valid) continue;
        await user[taskName](opt);
      }
    }
    async threadTask (taskName, thread) {
      let taskAll = [];
      let taskConf = { idx: 0 };
      while (thread--) taskAll.push(this.threads(taskName, taskConf));
      await Promise.all(taskAll);
    }
    time (t, x = null) {
      let xt = x ? new Date(x) : new Date;
      let e = {
        "M+": xt.getMonth() + 1,
        "d+": xt.getDate(),
        "h+": xt.getHours(),
        "m+": xt.getMinutes(),
        "s+": xt.getSeconds(),
        "q+": Math.floor((xt.getMonth() + 3) / 3),
        S: this.padStr(xt.getMilliseconds(), 3)
      };
      /(y+)/.test(t) && (t = t.replace(RegExp.$1, (xt.getFullYear() + "").substr(4 - RegExp.$1.length)));
      for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length)));
      return t;
    }
    async showmsg () {
      if (!this.notifyFlag) return;
      if (!this.notifyStr.length) return;
      var notify = require('./sendNotify');
      this.log('\n============== 推送 ==============');
      await notify.sendNotify(this.name, this.notifyStr.join('\n'));
    }
    padStr (num, length, opt = {}) {
      let padding = opt.padding || '0';
      let mode = opt.mode || 'l';
      let numStr = String(num);
      let numPad = (length > numStr.length) ? (length - numStr.length) : 0;
      let pads = '';
      for (let i = 0; i < numPad; i++) {
        pads += padding;
      }
      if (mode == 'r') {
        numStr = numStr + pads;
      } else {
        numStr = pads + numStr;
      }
      return numStr;
    }
    json2str (obj, c, encode = false) {
      let ret = [];
      for (let keys of Object.keys(obj).sort()) {
        let v = obj[keys];
        if (v && encode) v = encodeURIComponent(v);
        ret.push(keys + '=' + v);
      }
      return ret.join(c);
    }
    str2json (str, decode = false) {
      let ret = {};
      for (let item of str.split('&')) {
        if (!item) continue;
        let idx = item.indexOf('=');
        if (idx == -1) continue;
        let k = item.substr(0, idx);
        let v = item.substr(idx + 1);
        if (decode) v = decodeURIComponent(v);
        ret[k] = v;
      }
      return ret;
    }
    randomPattern (pattern, charset = 'abcdef0123456789') {
      let str = '';
      for (let chars of pattern) {
        if (chars == 'x') {
          str += charset.charAt(Math.floor(Math.random() * charset.length));
        } else if (chars == 'X') {
          str += charset.charAt(Math.floor(Math.random() * charset.length)).toUpperCase();
        } else {
          str += chars;
        }
      }
      return str;
    }
    randomString (len, charset = 'abcdef0123456789') {
      let str = '';
      for (let i = 0; i < len; i++) {
        str += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return str;
    }
    randomList (a) {
      let idx = Math.floor(Math.random() * a.length);
      return a[idx];
    }
    wait (t) {
      return new Promise(e => setTimeout(e, t));
    }
    async exitNow () {
      await this.showmsg();
      let e = Date.now();
      let s = (e - this.startTime) / 1000;
      this.log('');
      this.log(`[${this.name}]运行结束，共运行了${s}秒`, { time: true });
      process.exit(0);
    }
  }
    (name)
}