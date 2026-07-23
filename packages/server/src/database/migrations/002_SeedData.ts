import { MigrationInterface, QueryRunner } from 'typeorm';

/** 种子数据 — 5 个默认板块 + 1 个管理员用户 */
export class SeedData002 implements MigrationInterface {
  name = 'SeedData002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 插入管理员用户（password hash 预留，后续由 seed-admin.ts 脚本生成真实 hash）
    await queryRunner.query(`
      INSERT INTO users (phone, nickname, role, status, points_balance)
      VALUES ('admin', '管理员', 'admin', 'active', 0)
    `);

    // 插入 5 个默认板块
    await queryRunner.query(`
      INSERT INTO sections (name, description, sort_order, status) VALUES
        ('观测分享', '分享你的天文观测成果和经验', 1, 'approved'),
        ('设备讨论', '望远镜、赤道仪、相机等天文设备交流', 2, 'approved'),
        ('活动招募', '线上/线下天文活动组织与报名', 3, 'approved'),
        ('天文知识', '天文知识科普与学习讨论', 4, 'approved'),
        ('求助', '遇到问题？在这里寻求帮助', 5, 'approved')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM sections WHERE name IN ('观测分享', '设备讨论', '活动招募', '天文知识', '求助')`);
    await queryRunner.query(`DELETE FROM users WHERE phone = 'admin' AND role = 'admin'`);
  }
}
