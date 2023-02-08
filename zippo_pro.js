/*
微信小程序 zippo会员中心

使用类来实现的版本, 包含了简单的类继承

cron: 24 7,19 * * *
*/
const $ = new Env('zippo会员中心');
const got = require('got');

const envPrefix = 'zippo'
const envSplitor = ['\n','&','@'] //支持多种分割，但要保证变量里不存在这个字符
const ckNames = [envPrefix+'Cookie'] //可以支持多变量

const MAX_THREAD = parseInt(process.env[envPrefix+'Thread']) || 50; //默认最大并发数
const DEFAULT_TIMEOUT=8000, DEFAULT_RETRY=3;

//这里配置了一些常量, 不需要后面每次重新写了
const default_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN';
const Referer = 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html';
const appid = 'wxaa75ffd8c2d75da7';

class BasicClass {
    constructor() {
        this.index = $.userIdx++;
        this.name = '';
        this.valid = true;
        
        //设置got的默认超时等参数
        this.got = got.extend({
            retry: {limit:0},
            timeout: DEFAULT_TIMEOUT,
            followRedirect: false,
        })
    }
    //给每个账户打印前面加上自己的名字
    log(msg, opt = {}) {
        var m = '', n = $.userCount.toString().length;;
        if (this.index) m += `账号[${$.padStr(this.index,n)}]`;
        if (this.name) m += `[${this.name}]`;
        $.log(m + msg, opt);
    }
    //使用自己的got实例发包,可以实现设置每个账号自己的默认UA等
    async request(opt) {
        var resp = null, count = 0;
        var fn = opt.fn || opt.url;
        opt.method = opt?.method?.toUpperCase() || 'GET';
        while (count++ < DEFAULT_RETRY) {
            try {
                var err = null;
                const errcodes = ['ECONNRESET', 'EADDRINUSE', 'ENOTFOUND', 'EAI_AGAIN'];
                await this.got(opt).then(t => {
                    resp = t
                }, e => {
                    err = e;
                    resp = e.response;
                });
                if(err) {
                    if(err.name == 'TimeoutError') {
                        this.log(`[${fn}]请求超时(${err.code})，重试第${count}次`);
                    } else if(errcodes.includes(err.code)) {
                        this.log(`[${fn}]请求错误(${err.code})，重试第${count}次`);
                    } else {
                        let statusCode = resp?.statusCode || -1;
                        this.log(`[${fn}]请求错误(${err.message}), 返回[${statusCode}]`);
                        break;
                    }
                } else {
                    break;
                }
            } catch (e) {
                this.log(`[${fn}]请求错误(${e.message})，重试第${count}次`);
            };
        }
        let {statusCode=-1,headers=null,body=null} = resp;
        if (body) try {body = JSON.parse(body);} catch {};
        return {statusCode,headers,result:body};
    }
}
let http = new BasicClass();

class UserClass extends BasicClass {
    constructor(ck) {
        super()
        let info = ck.split('#');
        this.openid = info[0];
        this.session_key = decodeURIComponent(info[1]);
        this.point = 0;
        
        this.got = this.got.extend({
            headers:{
                Connection:'keep-alive',
                'User-Agent': default_UA,
                Referer,
            },
        })
    }
    
    async ininttask() {
        this.valid = false;
        try {
            let options = {
                fn: 'ininttask',
                method: 'post',
                url: `https://membercenter.zippo.com.cn/s2/interface/data.aspx`,
                searchParams: {
                    action: 'ininttask',
                },
                form: {
                    openid: this.openid,
                    session_key: this.session_key,
                    unionid: '',
                    appid,
                },
            }
            let {result} = await this.request(options)
            if(result?.errcode == 0) {
                this.valid = true;
                for(let task of (result?.data?.task || [])) {
                    switch(task.title) {
                        case '签到':
                            this.log(`今天${task.task_status==0?'未':'已'}签到`);
                            if(task.task_status==0) {
                                await this.signin();
                            }
                            break;
                        default:
                            let str = task.task_status==0 ? '未完成' : (task.task_status==1 ? '已完成未领取奖励' : '已领取奖励');
                            this.log(`任务[${task.title}] -- ${str}`);
                            switch(Number(task.task_status)) {
                                case 0:
                                    await this.dotask(task,1);
                                    //注意这里没有了break, 那么脚本会继续往下走直至遇到break, 也就是会自动执行 await this.dotask(task,2)
                                case 1:
                                    await this.dotask(task,2);
                                    break;
                                default:
                                    break;
                            }
                            break;
                    }
                }
            } else {
                this.log(`查询账号任务失败`);
            }
        } catch (e) {
            console.log(e)
        }
    }
    
    async signin() {
        try {
            let options = {
                fn: 'signin',
                method: 'post',
                url: `https://membercenter.zippo.com.cn/s2/interface/data.aspx`,
                searchParams: {
                    action: 'signin',
                },
                form: {
                    daykey: $.time('yyyyMMdd'),
                    openid: this.openid,
                    session_key: this.session_key,
                    unionid: '',
                    appid,
                },
            }
            let {result} = await this.request(options)
            if(result?.errcode == 0) {
                this.log(`签到成功`);
            } else {
                this.log(`签到失败[${result?.errcode}]: ${result?.errmsg}`);
            }
        } catch (e) {
            console.log(e)
        }
    }
    
    async dotask(task,acttype) {
        try {
            let str = acttype==1 ? '完成' : '领取奖励';
            let options = {
                fn: 'dotask',
                method: 'post',
                url: `https://membercenter.zippo.com.cn/s2/interface/data.aspx`,
                searchParams: {
                    action: 'dotask',
                },
                form: {
                    taskid: task.taskid,
                    acttype,
                    openid: this.openid,
                    session_key: this.session_key,
                    unionid: '',
                    appid,
                },
            }
            let {result} = await this.request(options)
            if(result?.errcode == 0) {
                this.log(`任务[${task.title}]${str}成功`);
            } else {
                this.log(`任务[${task.title}]${str}失败[${result?.errcode}]: ${result?.errmsg}`);
            }
        } catch (e) {
            console.log(e)
        }
    }
    
    async inintmembers() {
        this.valid = false;
        try {
            let options = {
                fn: 'inintmembers',
                method: 'post',
                url: `https://membercenter.zippo.com.cn/s2/interface/data.aspx`,
                searchParams: {
                    action: 'inintmembers',
                },
                form: {
                    openid: this.openid,
                    session_key: this.session_key,
                    unionid: '',
                    appid,
                },
            }
            let {result} = await this.request(options)
            if(result?.errcode == 0) {
                this.valid = true;
                let info = result?.data?.[0];
                if(info) {
                    this.name = info.Mobile__c || '';
                    this.point = info.AvailablePoints__c || 0;
                }
            } else {
                this.log(`查询账号失败[${result?.errcode}]: ${result?.errmsg}`);
            }
        } catch (e) {
            console.log(e)
        }
    }
    
    //做任务逻辑
    async userTask() {
        $.log(`\n============= 账号[${this.index}] =============`);
        await this.inintmembers();
        if(!this.valid) return;
        await this.ininttask();
        await this.inintmembers();
        this.log(`积分: ${this.point}`);
    }
}

!(async () => {
    $.log(`最大并发数: ${MAX_THREAD}`);
    $.log('');
    
    //封装的读取变量方法, 可以自己另外写也可以直接用, 读取到的账号会存入 $.userList 中
    $.read_env(UserClass);
    
    //正常的做任务流程
    for(let user of $.userList) {
        await user.userTask();
    }
    
    //封装的并发方法, 想试的把下面的//删掉
    //await $.threadTask('userTask',MAX_THREAD);
    
})()
.catch((e) => $.log(e))
.finally(() => $.exitNow())

function Env(name) {
    return new class {
        constructor(name) {
            this.name = name;
            this.startTime = Date.now();
            this.log(`[${this.name}]开始运行\n`, {time: true});
            this.notifyStr = [];
            this.notifyFlag = true;
            this.userIdx = 0;
            this.userList = [];
            this.userCount = 0;
        }
        log(msg, options = {}) {
            let opt = {console: true};
            Object.assign(opt, options);
            if (opt.time) {
                let fmt = opt.fmt || 'hh:mm:ss';
                msg = `[${this.time(fmt)}]` + msg;
            }
            if (opt.notify) this.notifyStr.push(msg);
            if (opt.console) console.log(msg);
        }
        read_env(Class) {
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
                this.log(`未找到变量，请检查变量${ckNames.map(x => '['+x+']').join('或')}`, {notify: true});
                return false;
            }
            this.log(`共找到${this.userCount}个账号`);
            return true;
        }
        async threads(taskName, conf, opt = {}) {
            while (conf.idx < $.userList.length) {
                let user = $.userList[conf.idx++];
                if(!user.valid) continue;
                await user[taskName](opt);
            }
        }
        async threadTask(taskName, thread) {
            let taskAll = [];
            let taskConf = {idx:0};
            while(thread--) taskAll.push(this.threads(taskName, taskConf));
            await Promise.all(taskAll);
        }
        time(t, x = null) {
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
            for(let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length)));
            return t;
        }
        async showmsg() {
            if(!this.notifyFlag) return;
            if(!this.notifyStr.length) return;
            var notify = require('./sendNotify');
            this.log('\n============== 推送 ==============');
            await notify.sendNotify(this.name, this.notifyStr.join('\n'));
        }
        padStr(num, length, opt = {}) {
            let padding = opt.padding || '0';
            let mode = opt.mode || 'l';
            let numStr = String(num);
            let numPad = (length > numStr.length) ? (length - numStr.length) : 0;
            let pads = '';
            for (let i=0; i < numPad; i++) {
                pads += padding;
            }
            if (mode == 'r') {
                numStr = numStr + pads;
            } else {
                numStr = pads + numStr;
            }
            return numStr;
        }
        json2str(obj, c, encode = false) {
            let ret = [];
            for (let keys of Object.keys(obj).sort()) {
                let v = obj[keys];
                if(v && encode) v = encodeURIComponent(v);
                ret.push(keys + '=' + v);
            }
            return ret.join(c);
        }
        str2json(str, decode = false) {
            let ret = {};
            for (let item of str.split('&')) {
                if(!item) continue;
                let idx = item.indexOf('=');
                if(idx == -1) continue;
                let k = item.substr(0, idx);
                let v = item.substr(idx + 1);
                if(decode) v = decodeURIComponent(v);
                ret[k] = v;
            }
            return ret;
        }
        randomPattern(pattern, charset = 'abcdef0123456789') {
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
        randomString(len, charset = 'abcdef0123456789') {
            let str = '';
            for (let i = 0; i < len; i++) {
                str += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return str;
        }
        randomList(a) {
            let idx = Math.floor(Math.random() * a.length);
            return a[idx];
        }
        wait(t) {
            return new Promise(e => setTimeout(e, t));
        }
        async exitNow() {
            await this.showmsg();
            let e = Date.now();
            let s = (e - this.startTime) / 1000;
            this.log('');
            this.log(`[${this.name}]运行结束，共运行了${s}秒`, {time: true});
            process.exit(0);
        }
    }
    (name)
}