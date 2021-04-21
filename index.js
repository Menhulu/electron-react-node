const Koa = require('koa')
const cors = require('@koa/cors');
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const koaBody = require('koa-body')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const config = require('./pub/config/config.js');
const session = require('koa-session');
const RedisStore = require('koa2-session-redis');

const index = require('./routes/index')

const app = new Koa()

// CORS
app.use(cors());

// static
// app.use(Static(__dirname + '/public'))

// error handler
onerror(app)

// middlewares
app.use(koaBody({
  multipart: true,
  formLimit:'10mb',
  jsonLimit:'10mb'
}));
app.use(bodyparser({
  formLimit:'10mb',
  jsonLimit:'10mb',
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  // console.warn('-----------------',ctx.method,ctx.url,ms);
})

app.keys = ['Porschev'];
const redis_conf = {  
  key: 'Porschev',
  maxAge: config.REDIS.maxAge,
  overwrite: true,
  httpOnly: true,  
  rolling: false,
  sign: true,
  store: new RedisStore({
    host: config.REDIS.host,
    port: config.REDIS.port,    
    password: config.REDIS.password    
  })
};

app.use(session(redis_conf, app));

// routes
app.use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

app.listen(config.SERVER_PORT, () => {
  console.log(`Starting at port ${config.SERVER_PORT}!`)
});

module.exports = app