// id	name	phone	address	date
// jddb-cn-north-1-42c3c4b712ae468b.jcloud.com
// mysql-cn-north-1-8b7616794f1d4133.public.jcloud.com


/**
 * 配置文件
 */
//发布配置
const production = {

    //服务器端口
    SERVER_PORT : 8080,
  
    //REDIS配置
    REDIS: {
        host: 'localhost',            
        port: 6379,
        password: "ipCam",
        maxAge: 3600000
    }
  }
  
  //开发配置
  const development = {
  
    //服务器端口
    SERVER_PORT : 8080,
  
    //REDIS配置
    REDIS: {
        host: 'localhost',            
        port: 6379,
        password: "ipCam",
        maxAge: 3600000
    },
  }
  // 上线之前需要修改为 发布配置
  const config = development
  
  module.exports = config