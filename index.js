const Koa = require('koa')
const app = new Koa()
const Router = require('koa-router')
const cors = require('koa2-cors');

const genKey = require('./modules/genUUID')
const otp = require('./modules/verify')

let page = new Router()
page.get('/generateKey', async ( ctx )=>{

    account = ctx.query.account;
    if (account == undefined || account == null || account.length == 0) {
        ctx.body = {
            "result": "account not defined!",
        };
    }else{
        key = genKey.uuid.generateUUID();
        b32 = genKey.uuid.base32(key);
        qrcodeStr = encodeURIComponent('otpauth://totp/'+account+'?secret=' + b32);
        qrcodeUrl = 'https://qrcode.kaywa.com/img.php?s=8&d=' + qrcodeStr;
       
        ctx.body = {
            "secret_key": key,
            "base32": b32,
            "qrcodeUrl": qrcodeUrl,
            "qrcodeStr": qrcodeStr
        };
    }
}).get('/verify',async(ctx)=>{

    param = ctx.query;
    ctx.body = {
        "result": otp.totp.verify(param.code,param.key),
        "code": param.code,
        "key": param.key
    };
})

// Deal with CORS's problem
app.use(cors())

// let router = new Router()
// router.use('/api', page.routes(), page.allowedMethods())
app.use(page.routes()).use(page.allowedMethods())

app.listen(3000, '127.0.0.1', () => {
  console.log('[demo] route-use-middleware is starting at port 3000')
})
