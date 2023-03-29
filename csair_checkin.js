/*
南航签到（签到3里程，里程可以兑换机票）
以下都以青龙或nodejs环境为准

变量支持账号密码，多账号用\n分割
单账号：export csairCookie = '账号#密码'
多账号：export csairCookie = '账号1#密码\n账号2#密码'

下面一行是建议定时,青龙拉库会自动读取
cron: 0 6 * * *
*/

const $ = new Env('南航签到'); //青龙拉库会把 new Env('qwerty') 里面的名字qwerty作为定时任务名
const got = require('got'); //青龙发包依赖

const env_name = 'csairCookie'; //环境变量名字
const env = process.env[env_name] || ''; //或 process.env.zippoCookie, node读取变量方法. 后面的 || 表示如果前面结果为false或者空字符串或者null或者undifined, 就取后面的值

//got的基本用法, 封装一下方便之后直接调用, 新手可以不动他直接用就行
async function request (opt) {
  const DEFAULT_RETRY = 3; //请求出错重试三次
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

//脚本入口函数main()
async function main () {
  if (env == '') {
    //没有设置变量,直接退出
    console.log(`没有填写变量: ${env_name}`);
    return;
  }
  // console.log('账号信息', env);
  //多账号分割,这里默认是换行(\n)分割,其他情况自己实现
  //split('\n')会把字符串按照换行符分割, 并把结果存在user_ck数组里

  let user_ck = env.includes('\n') ? env.split('\n') : env.split('&');
  // console.log('user_ck', user_ck);

  let index = 1; //用来给账号标记序号, 从1开始
  //循环遍历每个账号
  for (let ck of user_ck) {
    if (!ck) continue; //跳过空行

    // console.log('ck:', ck);
    // 账号用#分割
    const account = ck.split('#')
    // 邮箱
    // let email = account[0]
    // 密码
    // let passwd = account[1]

    let user = {
      index,
      // email,
      // passwd,
    };
    index = index + 1; //每次用完序号+1
    //开始账号任务
    await userTask(user);
    //每个账号之间等1~5秒随机时间
    // let rnd_time = Math.floor(Math.random() * 4000) + 1000;
    // console.log(`账号[${user.index}]随机等待${rnd_time / 1000}秒...`);
    // await $.wait(rnd_time);
  }
}

async function userTask (user) {
  //任务逻辑都放这里了, 与脚本入口分开, 方便分类控制并模块化
  console.log(`\n============= 账号[${user.index}]开始任务 =============`)
  // await login(user)

  await signin(env, user)
}

/** 登录 */
const login = async (user) => {
  try {
    const options = {
      method: 'post', //post方法

      //url问号前面的地址
      url: 'https://wxapi.csair.com/marketing-tools/activity/join?type=APPTYPE&chanel=ss&lang=zh',

      //请求头, 所有接口通用
      headers: {
        // Connection: 'keep-alive',
        // 'Accept-Encoding': 'gzip,compress,br,deflate',
        // 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN',
        // Referer: 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html',
        Cookie: env,
      },
      // json: {
      //   email: user.email,
      //   passwd: user.passwd,
      // },
      //超时设置
      timeout: 15000,
    }
    //解构返回
    // console.log('登录的结果', await request(options));
    const { result, headers } = await request(options);
    console.log('result', result);


    // console.log('处理后的cookie', cookie);
    if (result?.ret === 1) {
      // console.log('cookie====', headers['set-cookie']);
      const cookieArr = headers['set-cookie']
      let cookie = ''
      cookieArr.forEach(item => {
        cookie += item
      })

      // console.log('处理前的cookie', cookie);
      // 处理cookie格式
      cookie = cookie.replace(/'/g, '').replace(/\s+/g, '').replace(/path\=\//g, '');
      console.log(`账号${user.email}，${result?.msg}`)
      console.log('====开始执行签到任务====');
      await signin(cookie, user)
    } else {
      //打印请求错误信息
      console.log(`账号${user.email}（${result?.ret}）: ${result?.msg}`);
    }
  } catch (error) {
    //打印错误信息
    console.log(error);
  }
}

/**
 * 签到接口
 * @param {string} cookie 登录后返回的cookie
 * @param {object} user 用户信息
 */
async function signin (cookie, user) {
  try {

    let urlObject = {
      method: 'post', //post方法

      //url问号前面的地址
      url: 'https://wxapi.csair.com/marketing-tools/activity/join?type=APPTYPE&chanel=ss&lang=zh',

      //请求头, 所有接口通用
      headers: {
        Connection: 'keep-alive',
        // 'Accept-Encoding': 'gzip,compress,br,deflate',
        // 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN',
        // Referer: 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html',
        Cookie: cookie
      },

      //超时设置
      timeout: 15000,
    }

    //解构返回
    const { result } = await request(urlObject);
    console.log('====签到result', result);
    if (result?.respCode === 1) {
      console.log(`账号[${user.index}]签到成功，${result?.respMsg}`)
    } else {
      //打印请求错误信息
      console.log(`账号[${user.index}][${result?.respCode}]: ${result?.respMsg}`);
    }
  } catch (e) {
    //打印错误信息
    console.log(e);
  }
}

//调用main()
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