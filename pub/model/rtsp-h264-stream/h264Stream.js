const ws = require('ws')
const url = require('url');
const util = require('util')
const events = require('events')
const rtsp2H264 = require("./rtsp2H264");
const querystring = require('querystring');
const debug = require("debug")("rtsp-server");
const H264_HEADER = Buffer.from([0x00, 0x00, 0x00, 0x01]);
STREAM_MAGIC_BYTES = "h264" // Must be 4 bytes

H264Stream = function (options) {
    this.name = options.name
    this.streamUrl = options.streamUrl
    this.username = options.username
    this.password = options.password
    this.width = options.width
    this.height = options.height
    this.server = options.server
    this.wsPort = options.wsPort
    // this.wsServer = undefined
    this.inputStreamStarted = false
    this.client = undefined
    this.rtsp2H264 = undefined
    // this.newClient = true
    this.startH264Stream()
    this.pipeStreamToSocketServer()
    return this
}

util.inherits(H264Stream, events.EventEmitter)

H264Stream.prototype.stop = function () {
    this.wsServer.close();
    this.wsServerMsg.close();
    // this.client.kill()
    this.inputStreamStarted = false;
    return this;
}

H264Stream.prototype.startH264Stream = function () {
    var gettingInputData, gettingOutputData, inputData, outputData
    this.rtsp2H264 = new rtsp2H264({
        id: this.name,
        url: this.streamUrl,
        username: this.username,
        password: this.password
    })

    this.client = this.rtsp2H264.client
    if (this.inputStreamStarted) {
        return
    }

    // this.rtsp2H264.on(`${this.name}-data`, (data) => {
    this.rtsp2H264.on('h264data', (data) => {
        // console.log('error::::::+++++++++',data);
        this.inputStreamStarted = true;
        return this.emit('camdata', data)
    })
    // 
    this.rtsp2H264.on('frameTimestamp', (data) => {
        // console.log('error::::::+++++++++',data);
        return this.emit('camTimestamp', data)
    })

    this.rtsp2H264.on('exitWithError', (err) => {
        debug(`${this.name}: ${err} happend, connection will be closed`);
        return this.emit('exitWithError')
    })
    return this
}

H264Stream.prototype.pipeStreamToSocketServer = function () {
    const videoHead = this.rtsp2H264.videoHead
    this.wsServer = new ws.Server({ noServer: true });
    this.wsServerMsg = new ws.Server({ noServer: true });


    // console.log('this.wsServer:::::', this.wsServer.options.path);
    this.wsServer.on("connection", (socket, request) => {
        return this.onSocketConnect(socket, request);
    })
    this.wsServerMsg.on("connection", (socket, request) => {
        return this.onSocketConnect(socket, request);
    })

    this.server.on('upgrade', (request, socket, head) => {
        const pathname = url.parse(request.url).pathname;
        // console.log('LLLLLL:', pathname);

        if (pathname === `/${this.name}`) {
            this.wsServer.handleUpgrade(request, socket, head, (ws) => {
                this.wsServer.emit('connection', ws, request);
            });
        } else if (pathname === `/${this.name}/timestamp`) {
            this.wsServerMsg.handleUpgrade(request, socket, head, (ws) => {
                this.wsServerMsg.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    this.wsServer.broadcast = function (data, opts) {
        // console.log('error::::::+++++++++',this.clients);
        let results = [];
        for (let client of this.clients) {
            if (client.readyState === 1) {
                if (client.newClient) {
                    // the first frame send to websocket client
                    if (client.headData.length < 5000) {
                        const totalLength = client.headData.length + data.length + H264_HEADER.length;
                        client.headData = Buffer.concat([client.headData, data, H264_HEADER], totalLength);
                        // console.log(client.headData.length);
                    } else {
                        const totalLength = videoHead.length + client.headData.length + data.length;
                        data = Buffer.concat([videoHead, client.headData, data], totalLength);
                        // console.log('new---------new',results);
                        results.push(client.send(data));
                        client.headData = Buffer.alloc(0);
                        client.newClient = false;
                    }
                } else {
                    // other frames send to websocket client
                    if (client.preData.length < 5000) {
                        const totalLength = client.preData.length + data.length;
                        client.preData = Buffer.concat([client.preData, data], totalLength);
                    } else {
                        const totalLength = H264_HEADER.length + client.preData.length + data.length + H264_HEADER.length;
                        data = Buffer.concat([H264_HEADER, client.preData, data, H264_HEADER], totalLength);
                        // const totalLength = client.preData.length + data.length;
                        // data = Buffer.concat([client.preData , data],totalLength);
                        // console.log('old---------old',results);
                        results.push(client.send(data));
                        client.preData = Buffer.alloc(0);
                    }
                }
            } else {
                results.push(console.log("Error: Client from remoteAddress " + client.remoteAddress + " not connected."))
            }
        }
        return results
    }

    this.wsServerMsg.broadcast = function (data, opts) {
        // console.log('error::::::+++++++++',this.clients);
        let results = [];
        for (let client of this.clients) {
            if (client.readyState === 1) {
                client.send(data);
            } else {
                results.push(console.log("Error: Client from remoteAddress " + client.remoteAddress + " not connected."))
            }
        }
        return results
    }

    return this.on('camdata', (data) => {
        data = Buffer.concat([data], data.length);
        return this.wsServer.broadcast(data);
    }),
        this.on('camTimestamp', (data) => {
            // console.log('TTTTTT', data);
            return this.wsServerMsg.broadcast(data);
        });
}

H264Stream.prototype.onSocketConnect = function (socket, request) {
    socket.newClient = true;
    socket.headData = Buffer.alloc(0);
    socket.preData = Buffer.alloc(0);
    console.log(`${this.name}: New WebSocket Connection (` + this.wsServer.clients.size + " total)")

    socket.remoteAddress = request.connection.remoteAddress
    socket.url = request.url

    return socket.on("close", (code, message) => {
        return console.log(`${this.name}: Disconnected WebSocket (` + this.wsServer.clients.size + " total)")
    })
}

module.exports = H264Stream