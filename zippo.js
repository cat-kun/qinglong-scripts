/*
微信小程序 zippo会员中心
以下都以青龙或nodejs环境为准

下面一行是建议定时,青龙拉库会自动读取
cron: 24 7,19 * * *
*/
/*
const和let的区别:
用const定义的变量以后不能再更改
用let定义的变量可以改
进阶内容: const 对象本身不可更改,但是对象里面的属性可以改,与指针有关
*/

const $ = new Env('微信小程序'); //青龙拉库会把 new Env('qwerty') 里面的名字qwerty作为定时任务名
const got = require('got'); //青龙发包依赖

const env_name = 'zippoCookie'; //环境变量名字
const env = process.env[env_name] || ''; //或 process.env.zippoCookie, node读取变量方法. 后面的 || 表示如果前面结果为false或者空字符串或者null或者undifined, 就取后面的值

//got的基本用法, 封装一下方便之后直接调用, 新手可以不动他直接用就行
async function request(opt) {
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
            if(err) {
                if(err.name == 'TimeoutError') {
                    console.log(`[${fn}]请求超时(${err.code})，重试第${count}次`);
                } else if(errcodes.includes(err.code)) {
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
    let {statusCode=-1,headers=null,body=null} = resp;
    if (body) try {body = JSON.parse(body);} catch {};
    return {statusCode,headers,result:body};
}

//脚本入口函数main()
async function main() {
    if(env == '') {
        //没有设置变量,直接退出
        console.log(`没有填写变量: ${env_name}`);
        return;
    }
    //多账号分割,这里默认是换行(\n)分割,其他情况自己实现
    //split('\n')会把字符串按照换行符分割, 并把结果存在user_ck数组里
    let user_ck = env.split('\n');
    
    let index = 1; //用来给账号标记序号, 从1开始
    //循环遍历每个账号
    for(let ck of user_ck) {
        if(!ck) continue; //跳过空行
        //默认用#分割openid和session_key, 前面是 openid 后面是 session_key
        let ck_info = ck.split('#');
        let openid = ck_info[0];
        let session_key = ck_info[1]; //其实session_key要不要都行, 这里为了教学就填上去
        //用一个对象代表账号, 里面存放账号信息
        let user = {
            index: index,
            openid, //简写法, 效果等同于 openid: openid,
            session_key: decodeURIComponent(session_key), //注意请求里的session_key是编码后的, 我们先解码一次
        };
        index = index + 1; //每次用完序号+1
        //开始账号任务
        await userTask(user);
        //每个账号之间等1~5秒随机时间
        let rnd_time = Math.floor(Math.random()*4000) + 1000;
        console.log(`账号[${user.index}]随机等待${rnd_time/1000}秒...`);
        await $.wait(rnd_time);
    }
}

async function userTask(user) {
    //任务逻辑都放这里了, 与脚本入口分开, 方便分类控制并模块化
    console.log(`\n============= 账号[${user.index}]开始任务 =============`)
    await ininttask(user);
    //后面可以自己加任务, 比如查看账户积分啥的
    //await chakanjifen(user);
    //await tom_niubi(user);
}

//任务列表
async function ininttask(user) {
    //user: 用户参数, 里面存放ck和账户信息啥的. 进阶可以用类(class)的方法的代替, 效率更高
    //养成良好习惯, 每个方法里面都用try catch包起来, 这样出错了也不影响下一个步骤进行
    try {
        //请求: https://membercenter.zippo.com.cn/s2/interface/data.aspx?action=ininttask
        let urlObject = {
            fn: 'ininttask', //调用方法名, 方便debug时候看是哪个方法出问题
            
            method: 'post', //post方法
            
            //url问号前面的地址
            url: 'https://membercenter.zippo.com.cn/s2/interface/data.aspx',
            //url问号后面的参数, 字典形式
            searchParams: {
                action: 'ininttask',
            },
            
            //请求头
            //got会自动填入url的host部分, 不需要手动设置host
            //如果是post,put,delete, got也会自动计算Content-Length
            //后面使用form/json的话, got会自动设置content-type
            //所以上面三个都可以省略
            headers: {
                Connection: 'keep-alive',
                //参数名字中间带-的需要用引号包起来, 不能直接写, 其他的可以省略引号
                'Accept-Encoding': 'gzip,compress,br,deflate', //这个一般来说不重要, 可以省却
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN', //简称UA
                Referer: 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html',
            },
            
            //请求体部分,注意get方法没有请求体
            //form对应application/x-www-form-urlencoded
            //json对应application/json
            //注意form会自动对内容进行编码, 不需要自己再手动编码
            form: {
                openid: user.openid,
                session_key: user.session_key,
                unionid: '',
                appid: 'wxaa75ffd8c2d75da7',
            },
            
            //超时设置, 超过15000毫秒自动停止请求
            timeout: 15000,
        }
        
        //解构返回, 只需要result也可以这样:
        // const {result} = await request(urlObject);
        const {statusCode,headers,result} = await request(urlObject);
        // ?.语法: 前面的结果为null/undefined的时候不再执行后面操作, 可以简单的防止出错
        if(result?.errcode==0) {
            //errcode==0的时候表示请求正常
            let tasklist = result?.data?.task || []; //取task数组,如果取不到就取空数组防止下面出错
            //遍历tasklist里面的元素, 也就是每个任务
            for(let task of tasklist) {
                //判断不同任务类型做不同请求
                switch(task.title) {
                    //签到任务调用签到接口
                    case '签到':
                        if(task.task_status==0) {
                            //task_status是0的时候代表未签到,这时候才去签到
                            let rnd_time = Math.floor(Math.random()*1000) + 1000;
                            console.log(`账号[${user.index}]随机等待${rnd_time/1000}秒...`);
                            await $.wait(rnd_time); //随机等待
                            await signin(user);
                        } else {
                            console.log(`账号[${user.index}]今天已签到`);
                        }
                        break;
                    //其他任务调用通用任务接口
                    default:
                        if(task.task_status==0) {
                            //task_status是0代表未完成
                            console.log(`账号[${user.index}]任务[${task.title}]未完成, 去做任务`);
                            let rnd_time = Math.floor(Math.random()*1000) + 1000;
                            console.log(`账号[${user.index}]随机等待${rnd_time/1000}秒...`);
                            await $.wait(rnd_time); //随机等待
                            await dotask(user,task,1); //做任务
                            rnd_time = Math.floor(Math.random()*1000) + 1000; //前面已经用过let定义rnd_time了,这里直接复用不要再let一次,不然会出错
                            console.log(`账号[${user.index}]随机等待${rnd_time/1000}秒...`);
                            await $.wait(rnd_time); //随机等待
                            await dotask(user,task,2); //领奖励
                        } else if(task.task_status==1) {
                            //task_status是1代表已完成未领取奖励
                            console.log(`账号[${user.index}]任务[${task.title}]已完成, 未领取奖励, 去领取`);
                            let rnd_time = Math.floor(Math.random()*1000) + 1000;
                            console.log(`账号[${user.index}]随机等待${rnd_time/1000}秒...`);
                            await $.wait(rnd_time); //随机等待
                            await dotask(user,task,2); //领奖励
                        } else {
                            //task_status是2代表已领取奖励
                            console.log(`账号[${user.index}]任务[${task.title}]已领取奖励`);
                        }
                        break;
                }
            }
        } else {
            //打印请求错误信息
            console.log(`账号[${user.index}]请求任务列表出错[${result?.errcode}]: ${result?.errmsg}`);
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
    }
}

//签到接口
async function signin(user) {
    try {
        //请求: https://membercenter.zippo.com.cn/s2/interface/data.aspx?action=signin
        let urlObject = {
            fn: 'signin',
            method: 'post', //post方法
            
            //url问号前面的地址
            url: 'https://membercenter.zippo.com.cn/s2/interface/data.aspx',
            //url问号后面的参数, 字典形式, 其实我们可以发现这个小程序不同接口的区别, 就是action和请求体参数不一样
            searchParams: {
                action: 'signin',
            },
            
            //请求头, 所有接口通用
            headers: {
                Connection: 'keep-alive',
                'Accept-Encoding': 'gzip,compress,br,deflate',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN',
                Referer: 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html',
            },
            
            //请求体
            form: {
                daykey: $.time('yyyyMMdd'), //封装在Env()里面的方法, 生成当时的时间格式
                openid: user.openid,
                session_key: user.session_key,
                unionid: '',
                appid: 'wxaa75ffd8c2d75da7',
            },
            
            //超时设置
            timeout: 15000,
        }
        
        //解构返回
        const {statusCode,headers,result} = await request(urlObject);
        if(result?.errcode==0) {
            console.log(`账号[${user.index}]签到成功`)
        } else {
            //打印请求错误信息
            console.log(`账号[${user.index}]签到失败[${result?.errcode}]: ${result?.errmsg}`);
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
    }
}

//任务接口
async function dotask(user,task,acttype) {
    try {
        //请求: https://membercenter.zippo.com.cn/s2/interface/data.aspx?action=signin
        let urlObject = {
            fn: 'dotask',
            method: 'post', //post方法
            
            //url问号前面的地址
            url: 'https://membercenter.zippo.com.cn/s2/interface/data.aspx',
            //url问号后面的参数, 字典形式
            searchParams: {
                action: 'dotask',
            },
            
            //请求头, 所有接口通用
            headers: {
                Connection: 'keep-alive',
                'Accept-Encoding': 'gzip,compress,br,deflate',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN',
                Referer: 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html',
            },
            
            //请求体
            form: {
                taskid: task.taskid, //任务id
                acttype: acttype, //任务操作, 1代表完成任务, 2代表领取奖励, 这个靠自己理解
                openid: user.openid,
                session_key: user.session_key,
                unionid: '',
                appid: 'wxaa75ffd8c2d75da7',
            },
            
            //超时设置
            timeout: 15000,
        }
        
        //看是做任务还是领取任务
        let str = acttype==1 ? '完成任务' : '领取奖励';
        
        //解构返回
        const {statusCode,headers,result} = await request(urlObject);
        if(result?.errcode==0) {
            console.log(`账号[${user.index}]${str}[${task.title}]成功`)
        } else {
            //打印请求错误信息
            console.log(`账号[${user.index}]${str}[${task.title}]失败[${result?.errcode}]: ${result?.errmsg}`);
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
    }
}

//调用main()
main();

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