/*
 * @LastEditors: zhangjingya1
 */ 
module.exports = {
    apps: [{
        "name": "node-rtsp-service",
        "script": "./index.js",
        "max_memory_restart": "750M",
        //其它参数
        "watch": [  // 监控变化的目录，一旦变化，自动重启
            "pub",
            "public",
            "routes",
            "views"
        ],
        watch_delay: 500,
        "ignore_watch": [  // 从监控目录中排除
            "node_modules",
            "logs"
        ],
        "watch_options": {
            "followSymlinks": false
        },
        "error_file": "./logs/node-rtsp-service-error.log",  // 错误日志路径
        // "out_file": "./logs/node-rtsp-service-out.log",  // 普通日志路径
        // "env": {
        //     "NODE_ENV": "production"  // 环境参数，当前指定为生产环境
        // }
    }]
}