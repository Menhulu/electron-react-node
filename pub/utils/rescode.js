/*
 * @LastEditors: zhangjingya1
 */
/*
 * 返回码
 */
const resCode = {
    SessionExpired: -1,             //session过期
    Fail: 0,                        //失败
    Success: 1,                     //成功
    ArgsError: 2,                   //参数错误
    UserExisted: 10,                //用户已经存在
    UsernameOrPasswordError: 11,    //用户名或者密码错误      
    UserNotExist: 12,               //用户不存在    
};

const statusCode = {
    ERROR_401: (msg) => {
        return {
            code: 401,
            msg
        }
    },

    ERROR_403: (msg) => {
        return {
            code: 403,
            msg
        }
    },

    ERROR_404: (msg) => {
        return {
            code: 404,
            msg
        }
    },

    ERROR_412: (msg) => {
        return {
            code: 412,
            msg
        }
    },

    ERROR_451: (msg, data) => {
        return {
            code: 451,
            msg,
            data,
        }
    },

    ERROR_500: (msg, data) => {
        return {
            code: 500,
            msg,
            data,
        }
    },

    SUCCESS_200: (msg, data) => {
        return {
            code: 200,
            msg,
            data,
        }
    },

    SUCCESS_202: (msg, data) => {
        return {
            code: 202,
            msg,
            data,
        }
    }
}

module.exports = { resCode, statusCode }