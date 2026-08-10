import { MigrationInterface, QueryRunner } from 'typeorm';

/** 社区互动增强 — 签到 / 收藏 / 私信会话 / 私信消息 / 站内通知 表 */
export class CreateEngagementTables003 implements MigrationInterface {
  name = 'CreateEngagementTables003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- check_ins 每日签到表 ---
    await queryRunner.query(`
      CREATE TABLE check_ins (
        id           BIGSERIAL PRIMARY KEY,
        user_id      BIGINT NOT NULL,
        checkin_date VARCHAR(10) NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT UQ_check_ins_user_date UNIQUE (user_id, checkin_date)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_check_ins_user_date ON check_ins(user_id, checkin_date)`);

    // --- favorites 收藏表 ---
    await queryRunner.query(`
      CREATE TABLE favorites (
        id          BIGSERIAL PRIMARY KEY,
        user_id     BIGINT NOT NULL,
        target_type VARCHAR(10) NOT NULL,
        target_id   BIGINT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT UQ_favorites_triplet UNIQUE (user_id, target_type, target_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_favorites_user ON favorites(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_favorites_target ON favorites(target_type, target_id)`);

    // --- conversations 私信会话表 ---
    await queryRunner.query(`
      CREATE TABLE conversations (
        id              BIGSERIAL PRIMARY KEY,
        user_a_id       BIGINT NOT NULL,
        user_b_id       BIGINT NOT NULL,
        last_message_at TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_conversations_user_a ON conversations(user_a_id)`);
    await queryRunner.query(`CREATE INDEX idx_conversations_user_b ON conversations(user_b_id)`);

    // --- messages 私信消息表 ---
    await queryRunner.query(`
      CREATE TABLE messages (
        id              BIGSERIAL PRIMARY KEY,
        conversation_id BIGINT NOT NULL,
        sender_id       BIGINT NOT NULL,
        content         TEXT NOT NULL,
        is_read         BOOLEAN NOT NULL DEFAULT FALSE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_messages_conversation ON messages(conversation_id)`);
    await queryRunner.query(`CREATE INDEX idx_messages_sender ON messages(sender_id)`);

    // --- notifications 站内通知表 ---
    await queryRunner.query(`
      CREATE TABLE notifications (
        id          BIGSERIAL PRIMARY KEY,
        user_id     BIGINT NOT NULL,
        type        VARCHAR(20) NOT NULL,
        actor_id    BIGINT,
        target_type VARCHAR(10),
        target_id   BIGINT,
        content     VARCHAR(200) NOT NULL,
        is_read     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_notifications_user ON notifications(user_id, is_read)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS conversations`);
    await queryRunner.query(`DROP TABLE IF EXISTS favorites`);
    await queryRunner.query(`DROP TABLE IF EXISTS check_ins`);
  }
}
