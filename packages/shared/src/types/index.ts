/**
 * 太空猎人 - 共享类型定义
 */

/** 用户角色 */
export type UserRole = 'admin' | 'moderator' | 'member';

/** 用户基础信息 */
export interface IUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** 天文图像文件格式 */
export type ImageFormat = 'fits' | 'raw' | 'tiff' | 'jpeg' | 'png';

/** 图像处理状态 */
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** API 通用响应结构 */
export interface IApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 分页请求参数 */
export interface IPaginationParams {
  page: number;
  pageSize: number;
}

/** 分页响应结构 */
export interface IPaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
