
/*@萝卜
APP : 饿了么
饿了么吃货豆，需要点外卖同学的福利
脚本说明：目前只支持部分任务，500，1000吃货豆换无门槛外卖红包
重写：https://h5.ele.me/svip/task-list url script-request-header https://cdn.jsdelivr.net/gh/LubooC/Script@main/ELM/elmchd.js
青龙环境变量  export elmck='.............'
抓包 h5.ele.me 域名下的任何url 请求头中的Cookie
获取数据 饿了么App->我的-> 赚吃货豆
多账户 @
脚本cron  59 9,18 * * * 

4/20 更新：新增抢兑换优惠券，参与瓜分吃货豆
变量：elmdh 兑换设置，默认为false,开启兑换，如需开启兑换，请设置为true
变量：SM_STARTTIME 值:默认为60，当为60时，9点59分运行脚本，10点准时开枪，如果网络慢可以设置为59，则9点59分59秒开抢。
*/

const $ = new Env('饿了么吃货豆');
let status;
const notify = $.isNode() ? require('./sendNotify') : '';
status = (status = ($.getval("fhxzstatus") || "1")) > 1 ? `${status}` : ""; // 账号扩展字符
let elmckArr = []
let allMessage = '';
let time = Math.round(Date.now() / 1000)
let elmck = $.isNode() ? (process.env.elmck ? process.env.elmck : "") : ($.getdata('elmck') ? $.getdata('elmck') : "")
let elmdh = ($.isNode() ? process.env.elmdh : $.getdata('elmdh')) || 'false';
let elmcks = ""
let acceptTagCode, queryTagCode, arr = []
let num = rand(10, 99)
let umidToken = `defaultToken1_um_not_loaded@@https://tb.ele.me/wow/alsc/mod/d5275789de46503ba0908a9d@@${Date.now()}`
let ua = `defaultUA1_uab_not_loaded@@https://tb.ele.me/wow/alsc/mod/d5275789de46503ba0908a9d@@${Date.now()}`
let elmyqm = $.isNode() ? (process.env.elmyqm ? process.env.elmyqm : "") : ($.getdata('elmyqm') ? $.getdata('elmyqm') : "")
let ownerId = 'bfb0188'
Date.prototype.Format = function (fmt) { //author: meizz
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}
//


!(async () => {
  if (typeof $request !== "undefined") {
    fhxzck()
  } else {
    if (!$.isNode()) {
      elmckArr.push($.getdata('elmck'))
      let elmcount = ($.getval('elmcount') || '1');
      for (let i = 2; i <= elmcount; i++) {
        elmckArr.push($.getdata(`elmck${i}`))
      }

      await qswcdl()

    } else {
      if (process.env.elmck && process.env.elmck.indexOf('@') > -1) {
        elmckArr = process.env.elmck.split('@');
        console.log(`您选择的是用"@"隔开\n`)

      } else {
        elmcks = [process.env.elmck]
      };
      Object.keys(elmcks).forEach((item) => {
        if (elmcks[item]) {
          elmckArr.push(elmcks[item])
        }
      })

      await qswcdl()

    }
  }
  await notify.sendNotify(`饿了么吃货豆`, `${allMessage}`, '')

})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done())


//获取cookie 
function fhxzck() {
  if ($request.url.indexOf("svip") > -1) {
    const elmck = $request.headers['Cookie']
    if (elmck) $.setdata(elmck, `elmck${status}`)
    $.log(elmck)
    $.msg($.name, "", `饿了么${status}数据获取成功`)
  }
}


function qswcdl(timeout = 0) {
  return new Promise((resolve) => {
    let url = {
      url: 'https://luobook.coding.net/p/code.json/d/luobook/git/raw/master/code.json',
      headers: ``,
    }
    $.get(url, async (err, resp, data) => {
      try {

        data = JSON.parse(data);

          console.log(`\n脚本状态：${data.elmmsgi1}`)
          allMessage += ``;
          allMessage += `\n脚本状态：${data.elmmsgi1}`;

          console.log(`共${elmckArr.length}个账号`)
          if (elmdh == 'true') {
            console.log(`\n当前设置兑换优惠券`)
            allMessage += `\n当前设置兑换优惠券`;
            for (let k = 0; k < elmckArr.length; k++) {
              $.message = ""
              elmck = elmckArr[k]
              $.index = k + 1;
              console.log(`\n开始【饿了么账户兑换 ${$.index}】`)
              allMessage += `\n开始【饿了么账户兑换 ${$.index}】`;

              PrizeIndex(elmck);

            }
          } else {
            console.log(`\n当前设置不兑换优惠券`)
            allMessage += `\n当前设置不兑换优惠券`;
          }
          for (let k = 0; k < elmckArr.length; k++) {
            $.message = ""
            elmck = elmckArr[k]
            $.index = k + 1;
            console.log(`\n开始【饿了么账户 ${$.index}】`)
            allMessage += `\n开始【饿了么账户 ${$.index}】`;

            if(elmyqm){
            if(k==0){
              ownerId = 'bfb0188'
            }else{
              ownerId=elmyqm
            }
          }
            await user();

            $.log(`------------------任务结束------------------`)
          }

          allMessage += '\n';


      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}

async function PrizeIndex(elmck) {
  let nowtime = new Date().Format("s.S")
  let starttime = $.isNode() ? (process.env.SM_STARTTIME ? process.env.SM_STARTTIME * 1 : 60) : ($.getdata('SM_STARTTIME') ? $.getdata('SM_STARTTIME') * 1 : 60);

  if (nowtime < 59) {
    let sleeptime = (starttime - nowtime) * 1000;
    console.log(`\n整点兑换等待时间 ${sleeptime / 1000}`);
    await sleep(sleeptime)
  }
  await svip_scene(elmck);
}
function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
function svip_scene(elmck) {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.svip_scene/svip/engine/xSupply?params[]=%7B%22tagCode%22:%2243002%22,%22supplyInst%22:%2243002%7C178006%22,%22extra%22:%7B%22costFoodiePea%22:1000%7D%7D&bizCode=biz_code_main&longitude=113.38713836669${num}&latitude=22.931276321411${num}`,
      headers: {
        "Cookie": elmck,
        "Host": "h5.ele.me",
        "f-refer": "wv_h5",
        "Accept": "application/json, text/plain, */*",
        "x-shard": `loc=113.387${num}041531943,22.931${num}970003977`,
        "bx-umidToken": umidToken,
        "bx-ua": ua,
        "f-pTraceId": "WVNet_WV_2-3-30",
        "Accept-Language": "zh-cn",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json;charset=utf-8",
        "Origin": "https://tb.ele.me",
        "x-ua": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "Connection": "keep-alive"
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);

        if (result.data[0].xstatus == 1) {
          console.log(`\n🔔10元无门槛优惠卷兑换成功\n`);
          allMessage += `\n🔔10元无门槛优惠卷兑换成功\n`;
        } else {
          console.log(`\n🕛无门槛优惠卷兑换失败：${result.data[0].xmessage}\n`);
          allMessage += `\n🕛无门槛优惠卷兑换失败：${result.data[0].xmessage}\n`;
        }

      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


function home_ch_tasklist() {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.growth_finetune/v1/finetune/operate?bizScenarioCode=home_ch_tasklist&longitude=113.38713836669${num}&latitude=22.931276321411${num}`,
      headers: {
        "Cookie": elmck
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);

        actId = result.outputJson.moduleList.find(item => item.content.$attr.title == '瓜分吃货豆').content.$attr.actId

        if (actId) {

          await gfd(actId)

        }

      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


function gfd(actId) {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.svip_scene/svip/engine/queryTrafficSupply?tagParams=[{"tagCode":"347079","extra":{"solutionType":"QUERY","actId":"${actId}","sceneCode":"divide_chd_interact","client":"eleme"}}]&bizCode=biz_card_main&longitude=113.38713836669${num}&latitude=22.931276321411${num}`,
      headers: {
        "Cookie": elmck
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);

        if (result.code == 200) {
          let attribute = result.data[0].data[0].attribute

          console.log(`\n当前瓜分吃货豆:${attribute.lastActInfo.lastJackPotCount},参加人数：${attribute.lastActInfo.lastEnrollCount}`)
          allMessage += `\n当前瓜分吃货豆:${attribute.lastActInfo.lastJackPotCount},参加人数：${attribute.lastActInfo.lastEnrollCount}`;

          if (attribute.userStatus == 0 && attribute.isToReceive) {
            console.log(`\n当前待领取`);
            allMessage += `\n当前待领取`;

            let phaseId = attribute.lastActInfo.lastPhaseId
            let amount = attribute.lastPrizeInfo.amount

            await xSupply(phaseId, actId, amount)


          } else if (attribute.userStatus == 10) {

            console.log(`\n当前已报名，预计分得吃货豆：${parseInt(attribute.lastActInfo.lastJackPotCount / attribute.lastActInfo.lastEnrollCount)}`);
            allMessage += `\n当前已报名，预计分得吃货豆：${parseInt(attribute.lastActInfo.lastJackPotCount / attribute.lastActInfo.lastEnrollCount)}`;

          } else if (attribute.userStatus == 0 && attribute.isToReceive == false) {
            console.log(`\n当前待报名`);
            allMessage += `\n当前待报名`;
            let phaseId = attribute.lastActInfo.lastPhaseId

            await asac(phaseId, actId, attribute.safeCode)


          }


        }

      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}

function asac(phaseId, actId, asacid) {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.svip_scene/svip/engine/xSupply?asac=${asacid}`,
      headers: {
        "Cookie": elmck,
        "Host": "h5.ele.me",
        "f-refer": "wv_h5",
        "Accept": "application/json, text/plain, */*",
        "x-shard": `loc=113.387${num}041531943,22.931${num}970003977`,
        "bx-umidToken": umidToken,
        "bx-ua": ua,
        "f-pTraceId": "WVNet_WV_2-3-30",
        "Accept-Language": "zh-cn",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json;charset=utf-8",
        "Origin": "https://tb.ele.me",
        "x-ua": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "Connection": "keep-alive"
      },
      body: `{"params":[{"tagCode":"381410","extra":{"solutionType":"ENROLL","phaseId":${phaseId},"actId":"${actId}","sceneCode":"divide_chd_interact","client":"eleme"}}],"bizCode":"biz_card_main","longitude":113.38713836669${num},"latitude":22.931276321411${num}}`
    }
    $.post(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code == 200) {

          console.log(`\n瓜分参与成功`);
          allMessage += `\n瓜分参与成功`;

        } else {
          console.log(`\n瓜分参与失败：${result.message}`);
          allMessage += `\n瓜分参与失败：${result.message}`;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}

function xSupply(phaseId, actId, amount) {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.svip_scene/svip/engine/xSupply`,
      headers: {
        "Cookie": elmck,
        "Host": "h5.ele.me",
        "f-refer": "wv_h5",
        "Accept": "application/json, text/plain, */*",
        "x-shard": `loc=113.387${num}041531943,22.931${num}970003977`,
        "bx-umidToken": umidToken,
        "bx-ua": ua,
        "f-pTraceId": "WVNet_WV_2-3-30",
        "Accept-Language": "zh-cn",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json;charset=utf-8",
        "Origin": "https://tb.ele.me",
        "x-ua": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "Connection": "keep-alive"
      },

      body: `{"params":[{"tagCode":"427048","extra":{"solutionType":"RECEIVE_PRIZE","phaseId":${phaseId},"actId":"${actId}","sceneCode":"divide_chd_interact","amount":${amount}}}],"bizCode":"biz_card_main","longitude":113.38713836669${num},"latitude":22.931276321411${num}}`
    }
    $.post(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code == 200) {

          console.log(`\n瓜分领取成功：${amount}吃货豆`);
          allMessage += `\n瓜分领取成功：${amount}吃货豆`;

        } else {
          console.log(`\n瓜分领取失败：${result.message}`);
          allMessage += `\n瓜分领取失败：${result.message}`;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


//获取tagcode
function tagcode() {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.growth_finetune/v1/finetune/operate?bizScenarioCode=home_ch_tasklist&longitude=113.${num}&latitude=22.${num}`,
      headers: {
        "Cookie": elmck
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.success) {
          queryTagCode = result.outputJson.moduleList.find(item => item.content.$attr.queryTagCode).content.$attr.queryTagCode
          acceptTagCode = result.outputJson.moduleList.find(item => item.content.$attr.acceptTagCode).content.$attr.acceptTagCode
          console.log(`tagCode获取成功`);
          allMessage += '\ntagCode获取成功';

        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


//用户资产
function user() {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.svip_bonus/v1/users/supervip/pea/queryAccountBalance?types=[%22PEA_ACCOUNT%22]&longitude=113.${num}&latitude=22.${num}`,
      headers: {
        "Cookie": elmck
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.success) {
          let count = 0
          if (result.accountInfos.length != 0) {
            count = result.accountInfos[0].count
          }
          console.log(`当前吃货豆：${count}`);
          allMessage += `\n当前吃货豆：${count}`;

          await tagcode();
          await $.wait(500)
          await supportor()
          await supportoraff()
          await home_ch_tasklist()

          console.log('获取任务【目前只支持部分任务】');
          allMessage += '\n获取任务【目前只支持部分任务】';

          await menu();
          console.log('任务已完成');
          allMessage += '\n任务已完成';

          await userend();

          await queryBalance();

          await queryCasReward();

          await queryTaskswelfareCode()

          await queryBalancess();


        } else {
          console.log(`未登录，请检查CK`);
          allMessage += '\n未登录，请检查CK';

        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


//用户资产
function userend() {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.svip_bonus/v1/users/supervip/pea/queryAccountBalance?types=[%22PEA_ACCOUNT%22]&longitude=113.${num}&latitude=22.${num}`,
      headers: {
        "Cookie": elmck
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.success) {
          let count = 0
          if (result.accountInfos.length != 0) {
            count = result.accountInfos[0].count
          }
          console.log(`当前吃货豆：${count}`);
          allMessage += `\n当前吃货豆：${count}`;

        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}

function queryCasReward() {
  return new Promise((resolve) => {
    let url = {
      url: `https://httpizza.ele.me/ele-fin-promotion-activity/bonus/queryCasReward?bizScene=each_order_cash_back&grantStatus=ACCEPTED`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn", "Connection": "keep-alive",
        "Cookie": elmck,
        "Host": "httpizza.ele.me",
        "User-Agent": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "x-shard": "p=1F1C104E4242405D4041414240474A4B4B434341445F41405D4245444B40454A404646464B474545"
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        await $.wait(1000)

        let result = JSON.parse(data);
        if (result.cashReward) {

          for (let item of result.cashReward) {

            console.log(`领取悬浮金币：${item.amount / 100}`);
            allMessage += `\n领取悬浮金币：${item.amount / 100}`

            await drawBubbleCashReward(item.recordNo)

            await $.wait(1000)
          }


        }

      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


function drawBubbleCashReward(recordNos) {
  return new Promise((resolve) => {
    let url = {
      url: `https://httpizza.ele.me/ele-fin-promotion-activity/bonus/drawBubbleCashReward`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn", "Connection": "keep-alive",
        "Cookie": elmck,
        "Host": "httpizza.ele.me",
        "Content-Type": "application/json;charset=UTF-8",
        "User-Agent": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "x-shard": "p=1F1C104E4242405D4041414240474A4B4B434341445F41405D4245444B40454A404646464B474545"
      },
      body: `{"recordNos":["${recordNos}"]}`
    }
    $.post(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code == '000') {
          console.log(`领取成功`);
          allMessage += `\n领取成功`
        } else {
          console.log(`领取失败：${result.message}`);
          allMessage += `\n领取失败：${result.message}`
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


function accountWithdrawal(amount) {
  return new Promise((resolve) => {
    let url = {
      url: `https://httpizza.ele.me/ele-fin-promotion-activity/bonus/accountWithdrawal`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn", "Connection": "keep-alive",
        "Cookie": elmck,
        "Host": "httpizza.ele.me",
        "Content-Type": "application/json;charset=UTF-8",
        "User-Agent": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "x-shard": "p=1F1C104E4242405D4041414240474A4B4B434341445F41405D4245444B40454A404646464B474545"
      },
      body: `{"amount":${amount},"bizCode":"cashback","subSceneCode":"cash_back_wd","remark":"提现至钱包"}`
    }
    $.post(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code == '0000') {
          console.log(`提现至钱包:提现成功`);
          allMessage += `\n提现至钱包:提现成功`
        } else {
          console.log(`提现至钱包:提现失败：${result.msg}`);
          allMessage += `\n提现至钱包:提现失败：${result.msg}`
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


function queryTaskswelfareCode() {
  return new Promise((resolve) => {
    let url = {
      url: `https://httpizza.ele.me/ele-fin-promotion-activity/bonus/queryTasks?welfareCode=cash_back-1`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn", "Connection": "keep-alive",
        "Cookie": elmck,
        "Host": "httpizza.ele.me",
        "User-Agent": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "x-shard": "p=1F1C104E4242405D4041414240474A4B4B434341445F41405D4245444B40454A404646464B474545"
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code == '000') {
          console.log(`笔笔反：获取任务列表`);
          allMessage += `\n笔笔反：获取任务列表`
          for (let item of result.data) {
            await $.wait(500)
            if (item.status == 'unreceived') {
              await receiveAndFinishTask(item.taskName + '-' + item.taskDes, item.taskId, item.welfareCode)
            } else {
              console.log(`任务：` + item.taskName + '-' + item.taskDes + ' 已完成');
              allMessage += `\n任务：` + item.taskName + '-' + item.taskDes + ' 已完成'
            }
          }

        } else {
          console.log(`获取任务列表：${result.msg}`);
          allMessage += `\n获取任务列表：${result.msg}`
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}

function receiveAndFinishTask(msg, taskId, welfareCode) {
  return new Promise((resolve) => {
    let url = {
      url: `https://httpizza.ele.me/ele-fin-promotion-activity/bonus/receiveAndFinishTask`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn", "Connection": "keep-alive",
        "Cookie": elmck,
        "Host": "httpizza.ele.me",
        "Content-Type": "application/json;charset=utf-8",
        "User-Agent": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "x-shard": "p=1F1C104E4242405D4041414240474A4B4B434341445F41405D4245444B40454A404646464B474545"
      },
      body: `{"taskId":"${taskId}","scene":"saving-pot","welfareCode":"${welfareCode}"}`
    }
    $.post(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code == '000') {
          console.log(msg + ':成功');
          allMessage += `\n` + msg + ':成功'
        } else {
          console.log(msg + ' 失败：' + result.msg);
          allMessage += `\n` + msg + ' 失败: ' + result.msg
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}

function queryBalancess() {
  return new Promise((resolve) => {
    let url = {
      url: `https://httpizza.ele.me/ele-fin-promotion-activity/bonus/queryBalance?bizCode=cashback`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn", "Connection": "keep-alive",
        "Cookie": elmck,
        "Host": "httpizza.ele.me",
        "User-Agent": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "x-shard": "p=1F1C104E4242405D4041414240474A4B4B434341445F41405D4245444B40454A404646464B474545"
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code == '0000') {
          console.log(`笔笔返收益：${result.result / 100}元`);
          allMessage += `\n笔笔返收益：${result.result / 100}元`

          if (result.result > 0) {
            await accountWithdrawal(result.result)
          }

        } else {
          allMessage += `\n笔笔返收益：${result.msg}`
          console.log(`笔笔返收益：${result.msg}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}

function queryBalance() {
  return new Promise((resolve) => {
    let url = {
      url: `https://httpizza.ele.me/ele-fin-promotion-activity/bonus/queryBalance?bizCode=cashback`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn", "Connection": "keep-alive",
        "Cookie": elmck,
        "Host": "httpizza.ele.me",
        "User-Agent": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "x-shard": "p=1F1C104E4242405D4041414240474A4B4B434341445F41405D4245444B40454A404646464B474545"
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code == '0000') {
          console.log(`笔笔返收益：${result.result / 100}元`);
          allMessage += `\n笔笔返收益：${result.result / 100}元`
        } else {
          allMessage += `\n笔笔返收益：${result.msg}`
          console.log(`笔笔返收益：${result.msg}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}




function getLocalTime(nS) {
  return new Date(parseInt(nS) * 1000).toLocaleString().replace(/:\d{1,2}$/, ' ');
}

//用户资产
function supportor() {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/alpaca/v1/recommend/supportor`,
      body: `{"ownerId":"${ownerId}","fromOfficialAccount":false,"referUserId":"","restaurantId":"","referCode":"","referChannelCode":"","referChannelType":"","fromWeChatApp":false,"bizType":"1","v":"2.9","chInfo":"ch_app_chsub_Photo","actId":"1","longitude":113.${num},"latitude":22.${num}}`,
      headers: {
        "Cookie": elmck,
        "Host": "h5.ele.me",
        "f-refer": "wv_h5",
        "Accept": "application/json, text/plain, */*",
        "x-shard": `loc=113.387${num}041531943,22.931${num}970003977`,
        "bx-umidToken": umidToken,
        "bx-ua": ua,
        "f-pTraceId": "WVNet_WV_2-3-30",
        "Accept-Language": "zh-cn",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json;charset=utf-8",
        "Origin": "https://tb.ele.me",
        "x-ua": `RenderWay/H5 AppName/elmc DeviceId/2423E${num}9-E718-48E0-${num}9B-8AF98332514E AppExtraInfo/%7B%22miniWua%22%3A%22HHnB_trF4qnXd7LBb1W7aTfbQadftHWJ%2BMg4rvN%2FalAHEZTC%2BerivaAPHBKR4lQ3HSPXDH9vbyVUHKsUvvKe8yrOaRJh1q5faiUwYONdp9G7Xqh7c4OyAaTzONYqZvnlRdg98KPMpv%2Fzs8fjbJiHjWqqRyruhKfS8iHhdyQ2QkCo%2By6s%3D%22%2C%22umidToken%22%3A%22zjdL%2Fh9LOnj3PzV9ZlUgfYV2c4wnliyM%22%2C%22ttid%22%3A%22201200%40eleme_iphone_10.0.5%22%2C%22deviceUUID%22%3A%222423E699-E718-48E0-999B-8AF98332514E%22%2C%22utdid%22%3A%22YZ2hE01GigMDAEmsd67%2FkXGZ%22%7D Longitude/113.387${num}041531943 Latitude/22.931${num}970003977`,
        "Connection": "keep-alive"
      }
    }
    $.post(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code != 0) {
          console.log(result.message)
          allMessage += `\n${result.message}`;

        } else {
          console.log(`获得：吃货联盟红包满` + result.data.couponCondition / 100 + '减' + result.data.couponAmount / 100 + ',过期时间：' + getLocalTime(result.data.couponEndTime));
          allMessage += '\n获得：吃货联盟红包满' + result.data.couponCondition / 100 + '减' + result.data.couponAmount / 100 + ',过期时间：' + getLocalTime(result.data.couponEndTime);

        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


function supportoraff() {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/alpaca/v1/recommend/bonus/bonusdetail`,
      headers: {
        "Cookie": elmck,
        "Host": "h5.ele.me",
        "Content-Type": "application/json; charset=utf-8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "f-refer": "wv_h5",
        "Accept": "*/*",
        "User-Agent": `Rajax/1 Apple/iPhone12,1 iOS/14.2 Eleme/10.0.5 ID/2423E6${num}-E718-48E0-999B-8AF98332514E; IsJailbroken/1 ASI/E${num}69D4C-6979-416E-A9DC-02FC21E319B6 Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AliApp(ELMC/10.0.5) UT4Aplus/0.0.6 WindVane/8.7.2 828x1792 WK`,
        "Referer": `https://h5.ele.me/ant/qrcode3/?open_type=miniapp&url_id=675&inviterId=${ownerId}`,
        "f-pTraceId": "WVNet_WV_2-2-68", "Accept-Language": "zh-cn"
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let ret =JSON.parse(data)
        if(ret.code==0){
          console.log(`邀请码：${ret.data.shareUrl.match(/inviterId=(\W+)&/)[1]}`);
        }else{
          console.log(ret.messages);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}



//任务列表
function menu() {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.svip_scene/svip/engine/queryTrafficSupply?tagParams[]=%7B%22tagCode%22:%22${queryTagCode}%22%7D&bizCode=biz_card_main&longitude=113.${num}&latitude=22.${num}`,
      headers: {
        "Cookie": elmck
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.code == 200) {
          let dataArr = result.data[0].data
          for (let i = 0; i < dataArr.length; i++) {
            if (dataArr[i].attribute.receiveStatus == 'TORECEIVE') {
              let missionType = dataArr[i].attribute.missionType
              if (missionType == 'SIMPLESIGNIN') {
                console.log(`任务：${dataArr[i].attribute.subTitle}`);
                allMessage += `\n任务：${dataArr[i].attribute.subTitle}`;

                let missionDefId = dataArr[i].attribute.missionDefId
                let missionCollectionId = dataArr[i].attribute.missionCollectionId
                await running(missionDefId, missionCollectionId, missionType)
                console.log(`随机等待15~16.5秒`)
                allMessage += `\n随机等待15~16.5秒`;
                // let s = rand(15100, 16500)
                await $.wait(500)
              }
            }
          }
          let code = [{ "DefId": "234001", "CollectionId": 36 }, { "DefId": "238001", "CollectionId": 36 }, { "DefId": "1150001", "CollectionId": 36 }, { "DefId": "3030001", "CollectionId": 170 }, { "DefId": "3226001", "CollectionId": 36 }, { "DefId": "3350001", "CollectionId": 36 }, { "DefId": "3500001", "CollectionId": 36 }, { "DefId": "4098001", "CollectionId": 36 }, { "DefId": "4182001", "CollectionId": 36 }, { "DefId": "4192001", "CollectionId": 36 }, { "DefId": "4206001", "CollectionId": 36 }, { "DefId": "4236001", "CollectionId": 36 }, { "DefId": "4238001", "CollectionId": 36 }, { "DefId": "4550002", "CollectionId": 36 }, { "DefId": "4604001", "CollectionId": 36 }, { "DefId": "4624002", "CollectionId": 36 }, { "DefId": "4642001", "CollectionId": 36 }, { "DefId": "4644001", "CollectionId": 36 }, { "DefId": "4648001", "CollectionId": 36 }, { "DefId": "4702001", "CollectionId": 36 }, { "DefId": "4708001", "CollectionId": 36 }, { "DefId": "4822002", "CollectionId": 36 }, { "DefId": "4932001", "CollectionId": 36 }, { "DefId": "4970001", "CollectionId": 36 }, { "DefId": "5180001", "CollectionId": 36 }, { "DefId": "5178001", "CollectionId": 36 }, { "DefId": "5288001", "CollectionId": 36 }, { "DefId": "5458001", "CollectionId": 36 }, { "DefId": "5632001", "CollectionId": 36 }, { "DefId": "5634001", "CollectionId": 36 }, { "DefId": "5636002", "CollectionId": 36 }, { "DefId": "5646002", "CollectionId": 36 }, { "DefId": "5652001", "CollectionId": 36 }, { "DefId": "5674001", "CollectionId": 36 }, { "DefId": "5700001", "CollectionId": 36 }, { "DefId": "5702001", "CollectionId": 36 }, { "DefId": "5704001", "CollectionId": 36 }, { "DefId": "5744002", "CollectionId": 36 }, { "DefId": "5756001", "CollectionId": 36 }, { "DefId": "5762001", "CollectionId": 36 }, { "DefId": "5758001", "CollectionId": 36 }, { "DefId": "5760001", "CollectionId": 36 }, { "DefId": "5768001", "CollectionId": 36 }, { "DefId": "5774001", "CollectionId": 36 }, { "DefId": "5792002", "CollectionId": 36 }, { "DefId": "5822001", "CollectionId": 36 }, { "DefId": "5824001", "CollectionId": 36 }, { "DefId": "5836001", "CollectionId": 36 }, { "DefId": "5850001", "CollectionId": 36 }]

          console.log(`完成隐藏任务`);
          for (let item of code) {
            await running(item['DefId'], item['CollectionId'], 'SIMPLESIGNIN')

          }

        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}
//执行任务
function running(missionDefId, missionCollectionId, missionType) {
  return new Promise((resolve) => {
    let url = {
      url: `https://h5.ele.me/restapi/biz.svip_scene/svip/engine/xSupply?params[]=%7B%22tagCode%22:%22${acceptTagCode}%22,%22extra%22:%7B%22missionDefId%22:${missionDefId},%22missionCollectionId%22:${missionCollectionId},%22missionType%22:%22${missionType}%22%7D%7D&bizCode=biz_code_main&longitude=113.38713836669${num}&latitude=22.931276321411${num}`,
      headers: {
        "Cookie": elmck
      }
    }
    $.get(url, async (err, resp, data) => {
      try {
        // console.log(data);
        let result = JSON.parse(data);
        if (result.data[0].attribute.code) {
          console.log(result.data[0].attribute.message);
          allMessage += `\n` + result.data[0].attribute.message;
          if (result.data[0].attribute.message == '成功') {
            arr.push({ 'DefId': missionDefId, 'CollectionId': missionCollectionId })
          }

        } else {
          console.log('任务失败：' + result.data[0].xmessage);
          allMessage += `\n任务失败：` + result.data[0].xmessage;


        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve()
      }
    }, 0)
  })
}


function rand(min, max) {
  return parseInt(Math.random() * (max - min + 1) + min, 10);
}

function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { if (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: i, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: i, statusCode: r, headers: o, rawBody: h }, s.decode(h, this.encoding)) }, t => { const { message: i, response: r } = t; e(i, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { let i = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...o } = t; this.got[s](r, o).then(t => { const { statusCode: s, statusCode: r, headers: o, rawBody: h } = t; e(null, { status: s, statusCode: r, headers: o, rawBody: h }, i.decode(h, this.encoding)) }, t => { const { message: s, response: r } = t; e(s, r, r && i.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
