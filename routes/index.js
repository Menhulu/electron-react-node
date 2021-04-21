/*
 * @LastEditors: zhangjingya1
 */ 
const Router = require('koa-router')
const RequestOnvif = require('./../pub/bll/onvif')
const title = '首页'

const router = new Router({
  prefix: '/api/v1'
})

const callback=()=>{
  console.warn('-----');
}

// 获取用户信息
router.post('/h264streams', RequestOnvif.h264streams);

module.exports = router