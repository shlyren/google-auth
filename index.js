const Koa = require('koa')
const app = new Koa()
const Router = require('koa-router')
const cors = require('koa2-cors');

const genKey = require('./modules/genUUID')
const otp = require('./modules/verify')

const mysql = require('mysql');
const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    port     : 3306,
    password : '123456',
    database : 'google_auth'
});
const pool = mysql.createPool({
    host     :  'localhost',
    user     :  'root',
    password :  '123456',
    database :  'google_auth'
  });

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
        // qrcodeStr = encodeURIComponent('otpauth://totp/'+account+'?secret=' + b32);
        qrcodeStr = 'otpauth://totp/Yuxiang:'+account+'?secret=' + b32 + '&issuer=Yuxiang';
        qrcodeUrl = 'https://qrcode.kaywa.com/img.php?s=8&d=' + qrcodeStr;
       
        ctx.body = {
            "secret_key": key,
            "base32": b32,
            "qrcodeUrl": qrcodeUrl,
            "qrcodeStr": qrcodeStr
        };


        // connection.connect();
        let result = await getAuth(account);
        if (result != null) {
            deleteAuth(result);
        }
        saveAuth(account, ctx.body);

        // connection.end();
        
    }
}).get('/verify', async (ctx) => {


    param = ctx.query;
    if (param == null || param.account == undefined || param.account == null || param.account.length == 0) {
        ctx.body = {
            'account': param.account,
            "result": false
        };
        return;
    }

    var rows = await getAuth(param.account);
    var result = rows[0];
    ctx.body = {
        'account': param.account,
        'result': otp.totp.verify(param.code, result.secret_key)
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



connection.connect();
function saveAuth(username, auth) {

    var addSql = 'INSERT INTO t_google_auth(username, secret_key, base32, url) VALUES (?,?,?,?)';
    var addSqlParams = [username, auth.secret_key, auth.base32, auth.qrcodeStr];

    //增
    connection.query(addSql, addSqlParams, function (err, result) {
        if(err){
            console.log('[INSERT ERROR] - ',err.message);
            return;
        }        

        console.log('--------------------------INSERT----------------------------');
        console.log('INSERT ID:', result);        
        console.log('-------------------------------------------------------------');  
        connection.release()
    });

}

function deleteAuth(auth) {
    
    var sql = 'delete from t_google_auth where username = "' + auth.username + '"';
    connection.query(sql, function (err, result) {
        if(err){
            console.log('[SELECT ERROR] - ', err.message);
            return;
        }
        console.log('--------------------------DELETE----------------------------');
        console.log(result);
        console.log('-------------------------------------------------------------'); 
        connection.release() 
    });

}

function getAuth(username) {
    var sql = 'SELECT * FROM t_google_auth where username = "' + username + '"';
    // 返回一个 Promise
    return new Promise(( resolve, reject ) => {
        pool.getConnection(function(err, connection) {
        if (err) {
            reject( err )
        } else {
            connection.query(sql, ( err, rows) => {
                if ( err ) {
                    reject( err )
                } else {
                    resolve( rows )
                }
                // 结束会话
                connection.release()
            });
        }
        })
    });
    //查
    // connection.query(sql, function (err, result) {
    //     if(err){
    //         console.log('[SELECT ERROR] - ',err.message);
    //         return;
    //     }

    //     var auth = null;
    //     if (result.length) {
    //         auth = result[result.length - 1];
    //     }
    //     console.log('--------------------------SELECT----------------------------');
    //     console.log(auth);
    //     console.log('-------------------------------------------------------------');  
    //     if (typeof callback == 'function') {
    //         callback(auth);
    //     }
        
    // });

}
