const $ = new Env('纳米AI搜索签到');
const got = require('got');
const crypto = require('crypto');

const env_name = 'NAMISCOOKIES'; // 存储Cookie的环境变量
const env = process.env[env_name] || ''; // 获取环境变量

async function request (opt) {
  const DEFAULT_RETRY = 3;
  var resp = null, count = 0;
  var fn = opt.fn || opt.url;
  opt.method = opt?.method?.toUpperCase() || 'GET';
  while (count++ < DEFAULT_RETRY) {
    try {
      var err = null;
      const errcodes = ['ECONNRESET', 'EADDRINUSE', 'ENOTFOUND', 'EAI_AGAIN'];
      await got(opt).then(t => {
        resp = t
      }, e => {
        err = e;
        resp = e.response;
      });
      if (err) {
        if (err.name == 'TimeoutError') {
          console.log(`[${fn}]请求超时(${err.code})，重试第${count}次`);
        } else if (errcodes.includes(err.code)) {
          console.log(`[${fn}]请求错误(${err.code})，重试第${count}次`);
        } else {
          let statusCode = resp?.statusCode || -1;
          console.log(`[${fn}]请求错误(${err.message}), 返回[${statusCode}]`);
          break;
        }
      } else {
        break;
      }
    } catch (e) {
      console.log(`[${fn}]请求错误(${e.message})，重试第${count}次`);
    };
  }
  let { statusCode = -1, headers = null, body = null } = resp;
  if (body) try { body = JSON.parse(body); } catch { };
  return { statusCode, headers, result: body };
}

async function main () {
  if (env == '') {
    console.log(`没有填写变量: ${env_name}`);
    return;
  }
  let user_ck = env.includes('\n') ? env.split('\n') : env.split('&');
  let index = 1;
  for (let ck of user_ck) {
    if (!ck) continue;
    const account = ck.split('#')
    let cookie = account[0]
    let user = {
      index,
      cookie,
    };
    index = index + 1;
    await userTask(user);
  }
}

async function userTask (user) {
  console.log(`\n============= 账号[${user.index}]开始任务 =============`)
  await signin(user)
}

async function signin (user) {
  try {
    const options = {
      method: 'POST',
      url: 'https://api.so.n.cn/api/user/coin/checkin',
      headers: {
        'brandCode': 'TS',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'access-token': 'access_token',
        'Cookie': user.cookie,
        'User-Agent': 'NAMISo/2.2.1 (iPhone; iOS 18.3; Scale/3.00; iPhone17,1)',
        'Accept': '*/*',
        'Host': 'api.so.n.cn',
        'Connection': 'keep-alive',
        'Accept-Language': 'zh-Hans-CN;q=1',
        'Accept-Encoding': 'gzip, deflate, br',
        'sign': '00187ef18bb31c296b166368dd040e11d71e6ae6494ac10287c5ef4d18a47235'
      },
      searchParams: {
        api_version: '20250208',
        app_name: 'namiso',
        app_version: '2.2.1.84',
        device_platform: 'iOS',
        format: 'JSON',
        idfa: '00000000-0000-0000-0000-000000000000',
        idfv: '8EC19684-34B0-4AE6-A3B3-B1A502DF2948',
        mid: '8ec19684-34b0-4ae6-a3b3-b1a502df2948',
        sign_method: 'SHA256',
        sign_version: '2.0.0',
        signnonce: '17390035580248182016708365',
        timestamp: '2025-02-08T08:32:38Z'
      }
    };
    const { result } = await request(options);
    if (result?.code === 0) {
      console.log(`账号[${user.index}]签到成功: ${result?.msg}`);
    } else {
      console.log(`账号[${user.index}]签到失败: ${result?.msg}`);
    }
  } catch (e) {
    console.log(e);
  }
}

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
  }(name)
}
