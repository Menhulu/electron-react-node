const onvif = require('node-onvif');
const fs = require('fs');
const net = require('net');
const http = require('http');
const server = http.createServer((req, res) => {
    // 允许所有跨域请求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('');
}).listen(21808);
const h264stream = require("../model/rtsp-h264-stream");
const { resCode, statusCode } = require('../utils/rescode');

// 存储多设备服务，占用端口，以后彻底优化后删除
const videoStream = {};

// 存储多设备服务，不占用端口
const streamsObj = {}
// 避免同时请求
const processObj = {}

// const socketClient = {};
let portNo = 19998;

async function portInUse(port) {
    return new Promise((resolve, reject) => {
        let server = net.createServer().listen(port);
        server.on('listening', function () {
            server.close();
            resolve(port);
        });
        server.on('error', function (err) {
            if (err.code == 'EADDRINUSE') {
                reject(err);
            }
        });
    });
}

const ipCam = {
    /**
   * API H264 multiple streams
   * 
   * @param  {object} ctx   上下文
   * @return {object}       结果
   */
    async h264streams(ctx) {
        let req = ctx.request.body;
        const rtspArray = [];
        const ipArray = [];
        const camList = [];

        if (req.ipcam && Array.isArray(req.ipcam)) {
            try {
                for (let i = 0; i < req.ipcam.length; i++) {
                    ipArray[i] = req.ipcam[i].address;
                    const camAddress = ipArray[i].replace(/\./g, '_');
                    camList[i] = {};
                    camList[i].name = camAddress;

                    if (!streamsObj[camAddress]) {
                        const onvifUrl = `http://${req.ipcam[i].address}:${req.ipcam[0].port ? req.ipcam[0].port : 80}/onvif/device_service`
                        const device = new onvif.OnvifDevice({
                            xaddr: onvifUrl,
                            user: req.ipcam[0].user,
                            pass: req.ipcam[0].password
                        });

                        rtspArray[i] = await device.init().then(async (info) => {
                            const profile = await device.getCurrentProfile();
                            camList[i].resolution = profile.video.encoder.resolution;
                            let url = await device.getUdpStreamUrl();
                            // url = url.replace('101', '102');
                            // url = url.replace('Profile_1', 'Profile_2');
                            return url.replace('://', `://${req.ipcam[0].user}:${req.ipcam[0].password}@`);
                        }).catch((error) => {
                            ctx.response.status = 500;
                            ctx.body = statusCode.ERROR_500('请求失败，设备不存在或者网络出现问题！', { 'adress': ipArray[i], 'error': error.message });
                            return error.message;
                        });

                        if (!processObj[camAddress] && typeof rtspArray[i] === 'string') {
                            processObj[camAddress] = true;
                            // 优化后不占用端口
                            streamsObj[camAddress] = new h264stream({
                                name: camAddress,
                                server: server,
                                wsPort: 21808,
                                width: camList[i].resolution.width,
                                height: camList[i].resolution.height,
                                streamUrl: rtspArray[i],
                                username: req.ipcam[0].user,
                                password: req.ipcam[0].password
                            });

                            // 循环查询websocket客户端连接数
                            streamsObj[camAddress].wsServer.on("connection", (socket, request) => {
                                if (!streamsObj[camAddress].wsServer.clients.size) {
                                    streamsObj[camAddress].interval = setInterval(function ping() {
                                        if (streamsObj[camAddress].wsServer.clients.size == 0) {
                                            streamsObj[camAddress].stop();
                                            // delete streamsObj[camAddress];
                                            // processObj[camAddress] = false;
                                            clearInterval(this);
                                        }
                                    }, 200);
                                }
                                return
                            })
                        }
                    }
                    camList[i].width = streamsObj[camAddress].width;
                    camList[i].height = streamsObj[camAddress].height;
                }

                ctx.response.status = 200;
                ctx.body = statusCode.SUCCESS_200('请求 stream 地址，成功', { 'camAddressList': ipArray, 'camList': camList, 'port': [21808] });
                // ctx.body = statusCode.SUCCESS_200('请求 stream 地址，成功', { 'camList': ipArray, 'port': [21808] });
                return camList;
            } catch (error) {
                ctx.response.status = 500;
                ctx.body = statusCode.ERROR_500('启动服务失败！', { 'error': error.message });
                return;
            }
        } else {
            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('请求失败，请求参数不能为空！');
            return;
        }
    }

}

module.exports = ipCam;