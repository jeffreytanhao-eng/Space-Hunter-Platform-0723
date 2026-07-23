/**
 * 管理员种子用户
 * phone: 'admin' — 用于管理员登录标识
 * nickname: '管理员'
 * role: 'admin'
 * password hash 预留 — 实际部署时通过 bcrypt 生成并更新
 *
 * 使用方式:
 *   import * as bcrypt from 'bcrypt';
 *   const hash = await bcrypt.hash('your-password', 10);
 *   然后更新数据库中该用户的 password_hash 字段（如后续添加）
 */
export const seedAdmin = {
  phone: 'admin',
  nickname: '管理员',
  role: 'admin' as const,
  status: 'active' as const,
  pointsBalance: 0,
  privacyProfile: 'public' as const,
  privacyDynamic: 'public' as const,
};
