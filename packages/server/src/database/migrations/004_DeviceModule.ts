import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 设备模块迁移 — 创建设备绑定表，并回填 device_uploads 的外键
 * 设计来源：设备模块 Phase0 补充规格 v1.0（Task D1）
 */
export class DeviceModule1786400000000 implements MigrationInterface {
  name = 'DeviceModule1786400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE devices (
        id              BIGSERIAL PRIMARY KEY,
        hardware_id     VARCHAR(64) NOT NULL UNIQUE,
        user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_token    VARCHAR(128) NOT NULL,
        name            VARCHAR(64),
        status          VARCHAR(20) NOT NULL DEFAULT 'active',
        "boundAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_upload_at  TIMESTAMPTZ,
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_devices_user_id ON devices(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_devices_status ON devices(status)`);
    await queryRunner.query(`CREATE INDEX idx_devices_device_token ON devices(device_token)`);

    // 回填 device_uploads → devices 外键（此前迁移中 device_id 仅为裸 BIGINT）
    await queryRunner.query(`
      ALTER TABLE device_uploads
        ADD CONSTRAINT fk_device_uploads_device
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device_uploads DROP CONSTRAINT IF EXISTS fk_device_uploads_device
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS devices`);
  }
}