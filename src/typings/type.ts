/*
 * @Author: zhaohongyun1@jd.com
 * @Date: 2019-09-27 10:27:28
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-01-07 20:08:20
 */
/**
 * 全局通用的类型定义
 */

export enum BusinessCode {
  SUCCESS = 200,
  NO_DATA = 201,
  DATA_ALREDAY_EXIST = 202,
  PARAMETER_IS_ERROR = 301,
  INTERNAL_ERROR = 302,
  FILE_TYPE_ERROR = 303,
  CAN_NOT_DELETE = 400,
  UNAUTHORIZED = 401,
  JOB_POST_FAILURE = 3001,
  JOB_RESP_FAILURE = 3002,
  NAME_ALREDAY_EXIST = 4000,
  WRONG_OBJECT_MODEL_TYPE = 4001,
  TEMPLATE_ID_ALREDAY_EXIST = 4002,
  OBJECT_TYPE_ID_ALREDAY_EXIST = 4003,
  OBJECT_MODEL_ID_ALREDAY_EXIST = 4004,
}

export enum BusinessErrMsg {
  SUCCESS = '成功',
  NO_DATA = '无数据',
  DATA_ALREDAY_EXIST = '数据已存在',
  PARAMETER_IS_ERROR = '参数错误',
  INTERNAL_ERROR = '服务器异常',
  FILE_TYPE_ERROR = '文件类型错误',
  CAN_NOT_DELETE = '当前设备已挂在终端设备,无法删除!',
  UNAUTHORIZED = '无权限',
  JOB_POST_FAILURE = '请求异常',
  JOB_RESP_FAILURE = '相应异常',
  WRONG_OBJECT_MODEL_TYPE = '物模型类型错误',
  TEMPLATE_ID_ALREDAY_EXIST = '模板ID已经存在',
  OBJECT_TYPE_ID_ALREDAY_EXIST = '物类型编码已存在',
  OBJECT_MODEL_ID_ALREDAY_EXIST = '物模型ID已存在',
}

// 分页信息
export interface PageVo {
  order?: string;
  pageNo: number;
  pageIndex?: number;
  pageSize: number;
  total: number;
  totalCount?: number;
  lastPage: number;
}

// response 结构
export type Response<T> = {
  [P in keyof T]: T[P];
} & { code: number | string; success: boolean; msg?: string; message?: string };
export interface RequestResponse {
  code: number;
  message: string;
  success: boolean;
  data: any;
}
export interface AuthItem {
  resourceCode?: string;
  resourceName?: string;
  resourceUri: string;
  resourceTypeId: string;
  resourceTypeName: string;
  parentId: number;
  level: number;
  hasChild: boolean;
  authId?: number;
  authVOList: {
    authId: any;
    authName: string;
    description: string;
  }[];
}

export interface MenuItem {
  key: string;
  name: string;
  icon: string;
  to: string | undefined;
  hasPermission: boolean;
  children: MenuItem[];
}
