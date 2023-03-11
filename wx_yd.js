/*
微信阅读
需要青龙环境
入口，微信打开 -> https://zl1208224800-1314804847.cos.ap-nanjing.myqcloud.com/index.html?upuid=10327150
抓包m.*.shop域名下cookie,填入环境变量 yuedu，多账户换行隔开

每天会验证2次左右，碰到验证文章手动打开看一篇即可
当前每日30篇*6轮180篇文章约2.2元
会自动提现
*/

const $ = new Env("微信阅读");
const notify = $.isNode() ? require('./sendNotify') : '';
let envSplitor = ['@', '\n']
let httpResult, httpReq, httpResp
let ckName = 'yuedu'
let userCookie = ($.isNode() ? process.env[ckName] : $.getdata(ckName)) || '';
let userList = []
let userIdx = 0
let userCount = 0
var msg = ''
let newurl = "http://m.xmrygnuv.shop"
///////////////////////////////////////////////////////////////////
class UserInfo {
    constructor(str) {
        //console.log(str)
        this.index = ++userIdx, this.idx = `账号[${this.index}] `, this.ck = str//.split('#'), this.u = this.ck[0], this.t = this.ck[1]
    }

    async getreadurl() {
        try {
            let t = Date.now()
            this.ul = newurl+`/tuijian/do_read?for\u003d\u0026zs\u003d\u0026pageshow\u0026r\u003d0.016638941704032684`;
            let body = ``;
            let urlObject = popu(this.ul, body,this.ck)
            await httpRequest('get', urlObject)
            let result = httpResult;
            //console.log(result)
            if ( result.jkey && result.url) {
                this.jkey=result.jkey
                await this.read(result.url.split('redirect_uri=')[1])
            }
            /*
            "1" == result.info.type && 1 !== this.dx && (console.log(`文章获取成功 `), this.b = 1, await $.wait(1000), await this.readfinish()),
                "3" == result.info.type && 1 !== this.dx && (console.log(`已限制阅读   尝试过验证`), this.x = result.info.key, this.c = result.info.url.split("/s/")[1], this.b = 2,
                    await $.wait(6000), await this.readfinish());
                    */
        } catch (e) {
            console.log(e)
        } finally {
            return Promise.resolve(1);
        }
    }

    async read(readurl) {
        try {
            let t = Date.now()
            readurl = decodeURIComponent(readurl);
            var sj = Math.random() * (8000 - 6000) + 6000

            if (readurl.indexOf("jump")==-1){

                console.log("疑似检测文章，不阅读")

                await $.wait(sj)
                return
                await this.readfinish()
                

            }
            this.jumpid = readurl.match(/jumpid=(.*?)&/)[1]
            this.state= readurl.match(/state=(.*?)&/)[1]
            this.ul = newurl+`/fast_reada/oiejr?jumpid=${this.jumpid}&code=031oV60w32RVa03URy0w3E0mzj3oV607&state=` + this.state
            //console.log(this.ul)
            
            let body = ``;
            let urlObject = popu(this.ul, body,this.ck)
            await httpRequest('get', urlObject)
            let result = httpResult;
            //console.log(result)
            //var sj = Math.random() * (8000 - 6000) + 6000
            //console.log('等待:'+ sj)
            await $.wait(sj)
            await this.readfinish()
            
            /*
            "1" == result.info.type && 1 !== this.dx && (console.log(`文章获取成功 `), this.b = 1, await $.wait(1000), await this.readfinish()),
                "3" == result.info.type && 1 !== this.dx && (console.log(`已限制阅读   尝试过验证`), this.x = result.info.key, this.c = result.info.url.split("/s/")[1], this.b = 2,
                    await $.wait(6000), await this.readfinish());
                    */
        } catch (e) {
            console.log(e)
        } finally {
            return Promise.resolve(1);
        }
    }
    async readfinish() {
        try {

            this.url=newurl+'/tuijian/do_read?for=&zs=&pageshow=&r=0.7882316111246435&jkey='+this.jkey
            let body = ``;
            let urlObject = popu(this.url, body,this.ck)
            //console.log(urlObject)
            await httpRequest('get', urlObject)
            let result = httpResult;
            if (result && result.success_msg) {
                console.log(result.success_msg)
            } else {
                console.log(result)
            }
            
            /*
            "success" == result.msg && console.log(`增加金币-> ${result.info.num} 阅读次数 ${result.info.read_num} 当前金币 ${result.info.read_money}`),
                result.code > 200 && (console.log(`已达到阅读量 等待刷新`), this.fx = 1);
                */
        } catch (e) {
            console.log(e)
        } finally {
            return Promise.resolve(1);
        }
    }
    async getreadinfo() {
        try {
            let t = Date.now()
            let url = newurl+`/tuijian`;
            let body = ``;
            let urlObject = popu(url, body,this.ck)
            //console.log()
            await httpRequest('get', urlObject)
            let result = httpResult;
            //console.log(result)
            

            if (result && result.data) {
                result = result.data
                this.uid = result.user.uid
                console.log(`\n今日阅读数量/收益：${result.infoView.num}/${result.infoView.score}分 \n`)
                console.log(`\n当前余额：${result.user.score}分  \n`)
                this.cishu = result.infoView.rest
                
                if (result.infoView.status != 1) {
                    this.fb = 1
                }
                if (result.infoView.status == 3) {
                   // console.log(result.infoView.msg)
                    msg += ''
                    console.log('检测文章，需手动过')
                    msg += `\n${this.idx} 碰到检测文章\n`
                    this.fb = 1
                 
                } else if (result.infoView.status == 4) {
                    console.log(result.infoView.msg)

                } else if (result.infoView.rest == 0){
                    console.log(result.infoView.msg)
                }
            }
        } catch (e) {
            console.log(e)
        } finally {
            return Promise.resolve(1);
        }
    }


    async withdrawal() {
        try {
            let t = Date.now()
            let url = newurl+`/withdrawal`;
            let body = ``;
            let urlObject = popu(url, body,this.ck)
            await httpRequest('get', urlObject)
            let result = httpResult;
            if (result.data.user) {
                result = result.data.user
                console.log(`\n当前账号余额 ${result.score}分 \n`)
                if (this.ck.indexOf('##') != -1) return
                this.f = parseInt(result.score)//= Number(Math.floor(result.info.sum / 1000))
                /*
                if (this.f < 3) console.log(`\n 不满足0.3 提现门槛\n`)
                this.f >= 3 && this.f < 5 && (this.cash = .3), this.f >= 10 && this.f < 20 && (this.cash = 1), this.f >= 20 && this.f < 50 && (this.cash = 2),
                    this.f >= 50 && this.f < 100 && (this.cash = 2), this.f >= 100 && this.f < 200 && (this.cash = 10), this.f >= 200 && (this.cash = 20)
                if (this.f >= 3) console.log(`\n可以提现 ${result.info.sum}金币 去提现 ${this.cash} 元\n`), await this.exchange()
                */
                if (this.f < 30) {
                    console.log(`不满足 提现门槛`)
                } else {
                    console.log(`去提现${this.f/100}元。。。。。。`)
                    await this.doWithdraw(this.f)
                }
            }
        } catch (e) {
            console.log(e)
        } finally {
            return Promise.resolve(1);
        }
    }
    async doWithdraw(tx) {
        try {
            if (tx > 2000) tx = 2000
            let t = Date.now()
            let url = newurl+`/withdrawal/doWithdraw`;
            let body = `amount=` + tx;
            let urlObject = popu(url, body,this.ck)
            await httpRequest('post', urlObject)
            let result = httpResult;
            console.log(result)

        } catch (e) {
            console.log(e)
        } finally {
            return Promise.resolve(1);
        }
    }
    async task() {
        try {
            
            let abc = [...new Array(15).keys()]
            console.log(`\n=========== ${this.idx} 开始阅读文章 ===========\n`)
            await this.getreadinfo()
            //console.log(this.fb)
            if (this.fb != 1) {
                for (let i = 0;i< this.cishu;i++) {
                    await this.getreadurl()

                    /*
                    break
                    if (this.dx == 1) break
                    await this.getreadurl()
                    if (this.fx == 1) break
                    */
                }
                await this.getreadinfo()
                //await $.wait(15000)
                
            }
            await this.withdrawal()
            
        } catch (e) {
            console.log(e)
        } finally {
            return Promise.resolve(1);
        }
    }
}

!(async () => {
    if (typeof $request !== "undefined") {
        await GetRewrite()
    } else {
        if (!(await checkEnv())) return;
        if (userList.length > 0) {
            await gethost()
            console.log('获取到newurl：'+newurl)
            for (let user of userList) {
                await user.task()
            }
            if (msg) await notify.sendNotify('微信阅读检测文章',msg)
        }
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $.done())

///////////////////////////////////////////////////////////////////

async function gethost() {
    try {
        let t = Date.now()
        let url = 'https://qun.haozhuang.cn.com/fq_url/rk';
        let body = ''
        let urlObject = popugethost(url, body)
        await httpRequest('get', urlObject)
        let result = httpResult;
        //console.log(result)
        if (result.jump) {
            newurl = result.jump.slice(0,-1)

        }
    } catch (e) {
        console.log(e)
    } finally {
        return Promise.resolve(1);
    }
}

async function checkEnv() {
    if (userCookie) {
        let splitor = envSplitor[0];
        for (let sp of envSplitor) {
            if (userCookie.indexOf(sp) > -1) {
                splitor = sp;
                break;
            }
        }
        for (let userCookies of userCookie.split(splitor)) {
            if (userCookies)
                userList.push(new UserInfo(userCookies))

        }
        userCount = userList.length
    } else {
    }

    console.log(`找到[${ckName}] 变量 ${userCount}个账号`)



    return true
}

////////////////////////////////////////////////////////////////////
function popu(url, body = '',ck) {
    //console.log(ck) /?upuid\u003d10314864
    let host = url.replace('//', '/').split('/')[1]
    let urlObject = {
        url: url,
        headers: {
            "Host": host,
            "Connection": "keep-alive",
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Linux; Android 12; M2012K11AC Build/SKQ1.211006.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/4425 MMWEBSDK/20221206 Mobile Safari/537.36 MMWEBID/4883 MicroMessenger/8.0.32.2300(0x2800205D) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64",
            "X-Requested-With": "com.tencent.mm",
            "Referer": newurl+"/tuijian/read",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "zh-CN,zh;q\u003d0.9,en-US;q\u003d0.8,en;q\u003d0.7",
            "Cookie": ck,
        },
        timeout: 5000,
    }
    if (body) {
        urlObject.body = body
    }

    return urlObject;
}
function popugethost(url, body = '',ck) {
    //console.log(ck)
    let host = url.replace('//', '/').split('/')[1]
    let urlObject = {
        url: url,
        headers:   {
            "Host": "qun.haozhuang.cn.com",
            "User-Agent": "Mozilla/5.0 (Linux; Android 12; M2012K11AC Build/SKQ1.211006.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/4425 MMWEBSDK/20221206 Mobile Safari/537.36 MMWEBID/4883 MicroMessenger/8.0.32.2300(0x2800205D) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64",
            "Accept": "*/*",
            "Origin": "https://kygj0209122405-1316151879.cos.ap-nanjing.myqcloud.com",
            "X-Requested-With": "com.tencent.mm",
            "Referer": "https://kygj0209122405-1316151879.cos.ap-nanjing.myqcloud.com/index.html?upuid\u003d10315076"
        },
        timeout: 5000,
    }
    if (body) {
        urlObject.body = body
    }

    return urlObject;
}

async function httpRequest(method, url) {
    //console.log(url)
    httpResult = null, httpReq = null, httpResp = null;
    return new Promise((resolve) => {
        $.send(method, url, async (err, req, resp) => {
            try {
                httpReq = req;
                httpResp = resp;
                if (err) {
                } else {
                    if (resp.body) {
                        if (typeof resp.body == "object") {
                            httpResult = resp.body;
                        } else {
                            try {
                                httpResult = JSON.parse(resp.body);
                            } catch (e) {
                                httpResult = resp.body;
                            }
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            } finally {
                resolve();
            }
        });
    });
}
////////////////////////////////////////////////////////////////////
function Env(a, b) {
    return "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0), new class {
        constructor(a, b) {
            this.name = a, this.notifyStr = "", this.startTime = (new Date).getTime(), Object.assign(this, b), console.log(`${this.name} 开始运行：
`)
        } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } getdata(b) { let a = this.getval(b); if (/^@/.test(b)) { let [, c, f] = /^@(.*?)\.(.*?)$/.exec(b), d = c ? this.getval(c) : ""; if (d) try { let e = JSON.parse(d); a = e ? this.lodash_get(e, f, "") : a } catch (g) { a = "" } } return a } setdata(c, d) { let a = !1; if (/^@/.test(d)) { let [, b, e] = /^@(.*?)\.(.*?)$/.exec(d), f = this.getval(b), i = b ? "null" === f ? null : f || "{}" : "{}"; try { let g = JSON.parse(i); this.lodash_set(g, e, c), a = this.setval(JSON.stringify(g), b) } catch (j) { let h = {}; this.lodash_set(h, e, c), a = this.setval(JSON.stringify(h), b) } } else a = this.setval(c, d); return a } getval(a) { return this.isSurge() || this.isLoon() ? $persistentStore.read(a) : this.isQuanX() ? $prefs.valueForKey(a) : this.isNode() ? (this.data = this.loaddata(), this.data[a]) : this.data && this.data[a] || null } setval(b, a) { return this.isSurge() || this.isLoon() ? $persistentStore.write(b, a) : this.isQuanX() ? $prefs.setValueForKey(b, a) : this.isNode() ? (this.data = this.loaddata(), this.data[a] = b, this.writedata(), !0) : this.data && this.data[a] || null } send(b, a, f = () => { }) { if ("get" != b && "post" != b && "put" != b && "delete" != b) { console.log(`无效的http方法：${b}`); return } if ("get" == b && a.headers ? (delete a.headers["Content-Type"], delete a.headers["Content-Length"]) : a.body && a.headers && (a.headers["Content-Type"] || (a.headers["Content-Type"] = "application/x-www-form-urlencoded")), this.isSurge() || this.isLoon()) { this.isSurge() && this.isNeedRewrite && (a.headers = a.headers || {}, Object.assign(a.headers, { "X-Surge-Skip-Scripting": !1 })); let c = { method: b, url: a.url, headers: a.headers, timeout: a.timeout, data: a.body }; "get" == b && delete c.data, $axios(c).then(a => { let { status: b, request: c, headers: d, data: e } = a; f(null, c, { statusCode: b, headers: d, body: e }) }).catch(a => console.log(a)) } else if (this.isQuanX()) a.method = b.toUpperCase(), this.isNeedRewrite && (a.opts = a.opts || {}, Object.assign(a.opts, { hints: !1 })), $task.fetch(a).then(a => { let { statusCode: b, request: c, headers: d, body: e } = a; f(null, c, { statusCode: b, headers: d, body: e }) }, a => f(a)); else if (this.isNode()) { this.got = this.got ? this.got : require("got"); let { url: d, ...e } = a; this.instance = this.got.extend({ followRedirect: !1 }), this.instance[b](d, e).then(a => { let { statusCode: b, request: c, headers: d, body: e } = a; f(null, c, { statusCode: b, headers: d, body: e }) }, b => { let { message: c, response: a } = b; f(c, a, a && a.body) }) } } time(a) { let b = { "M+": (new Date).getMonth() + 1, "d+": (new Date).getDate(), "h+": (new Date).getHours(), "m+": (new Date).getMinutes(), "s+": (new Date).getSeconds(), "q+": Math.floor(((new Date).getMonth() + 3) / 3), S: (new Date).getMilliseconds() }; for (let c in /(y+)/.test(a) && (a = a.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length))), b) new RegExp("(" + c + ")").test(a) && (a = a.replace(RegExp.$1, 1 == RegExp.$1.length ? b[c] : ("00" + b[c]).substr(("" + b[c]).length))); return a } async showmsg() { if (!this.notifyStr) return; let a = this.name + " \u8FD0\u884C\u901A\u77E5\n\n" + this.notifyStr; if ($.isNode()) { var b = require("./sendNotify"); console.log("\n============== \u63A8\u9001 =============="), await b.sendNotify(this.name, a) } else this.msg(a) } logAndNotify(a) { console.log(a), this.notifyStr += a, this.notifyStr += "\n" } msg(d = t, a = "", b = "", e) { let f = a => { if (!a) return a; if ("string" == typeof a) return this.isLoon() ? a : this.isQuanX() ? { "open-url": a } : this.isSurge() ? { url: a } : void 0; if ("object" == typeof a) { if (this.isLoon()) { let b = a.openUrl || a.url || a["open-url"], c = a.mediaUrl || a["media-url"]; return { openUrl: b, mediaUrl: c } } if (this.isQuanX()) { let d = a["open-url"] || a.url || a.openUrl, e = a["media-url"] || a.mediaUrl; return { "open-url": d, "media-url": e } } if (this.isSurge()) return { url: a.url || a.openUrl || a["open-url"] } } }; this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(d, a, b, f(e)) : this.isQuanX() && $notify(d, a, b, f(e))); let c = ["", "============== \u7CFB\u7EDF\u901A\u77E5 =============="]; c.push(d), a && c.push(a), b && c.push(b), console.log(c.join("\n")) } getMin(a, b) { return a < b ? a : b } getMax(a, b) { return a < b ? b : a } padStr(e, b, f = "0") { let a = String(e), g = b > a.length ? b - a.length : 0, c = ""; for (let d = 0; d < g; d++)c += f; return c + a } json2str(b, e, f = !1) { let c = []; for (let d of Object.keys(b).sort()) { let a = b[d]; a && f && (a = encodeURIComponent(a)), c.push(d + "=" + a) } return c.join(e) } str2json(e, f = !1) { let d = {}; for (let a of e.split("#")) { if (!a) continue; let b = a.indexOf("="); if (-1 == b) continue; let g = a.substr(0, b), c = a.substr(b + 1); f && (c = decodeURIComponent(c)), d[g] = c } return d } randomString(d, a = "abcdef0123456789") { let b = ""; for (let c = 0; c < d; c++)b += a.charAt(Math.floor(Math.random() * a.length)); return b } randomList(a) { let b = Math.floor(Math.random() * a.length); return a[b] } wait(a) { return new Promise(b => setTimeout(b, a)) } done(a = {}) {
            let b = (new Date).getTime(), c = (b - this.startTime) / 1e3; console.log(`
${this.name} 运行结束，共运行了 ${c} 秒！`), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(a)
        }
    }(a, b)
}
