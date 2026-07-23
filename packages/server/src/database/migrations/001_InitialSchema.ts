import { MigrationInterface, QueryRunner } from 'typeorm';

/** 初始 Schema — 创建所有表 + 索引 */
export class InitialSchema001 implements MigrationInterface {
  name = 'InitialSchema001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- users 表 ---
    await queryRunner.query(`
      CREATE TABLE users (
        id              BIGSERIAL PRIMARY KEY,
        phone           VARCHAR(20) UNIQUE,
        wechat_openid   VARCHAR(64) UNIQUE,
        nickname        VARCHAR(64) NOT NULL,
        avatar          VARCHAR(512),
        bio             TEXT,
        interests       JSONB,
        equipment       TEXT,
        points_balance  BIGINT NOT NULL DEFAULT 0,
        version         INT NOT NULL DEFAULT 1,
        privacy_profile VARCHAR(20) NOT NULL DEFAULT 'public',
        privacy_dynamic VARCHAR(20) NOT NULL DEFAULT 'public',
        role            VARCHAR(20) NOT NULL DEFAULT 'user',
        status          VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_users_phone ON users(phone)`);
    await queryRunner.query(`CREATE INDEX idx_users_wechat_openid ON users(wechat_openid)`);
    await queryRunner.query(`CREATE INDEX idx_users_role ON users(role)`);
    await queryRunner.query(`CREATE INDEX idx_users_status ON users(status)`);

    // --- sections 表 ---
    await queryRunner.query(`
      CREATE TABLE sections (
        id          BIGSERIAL PRIMARY KEY,
        name        VARCHAR(64) NOT NULL,
        description TEXT,
        icon        VARCHAR(512),
        sort_order  INT NOT NULL DEFAULT 0,
        created_by  BIGINT REFERENCES users(id),
        status      VARCHAR(20) NOT NULL DEFAULT 'approved',
        post_count  INT NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_sections_status ON sections(status)`);

    // --- posts 表 ---
    await queryRunner.query(`
      CREATE TABLE posts (
        id            BIGSERIAL PRIMARY KEY,
        user_id       BIGINT NOT NULL REFERENCES users(id),
        section_id    BIGINT NOT NULL REFERENCES sections(id),
        title         VARCHAR(200) NOT NULL,
        content       TEXT NOT NULL,
        images        JSONB,
        tags          JSONB,
        has_fits      BOOLEAN NOT NULL DEFAULT FALSE,
        status        VARCHAR(24) NOT NULL DEFAULT 'pending_auto',
        like_count    INT NOT NULL DEFAULT 0,
        comment_count INT NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_posts_user_id ON posts(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_posts_section_id ON posts(section_id)`);
    await queryRunner.query(`CREATE INDEX idx_posts_status ON posts(status)`);
    await queryRunner.query(`CREATE INDEX idx_posts_created_at ON posts(created_at)`);

    // --- comments 表 ---
    await queryRunner.query(`
      CREATE TABLE comments (
        id         BIGSERIAL PRIMARY KEY,
        post_id    BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id    BIGINT NOT NULL REFERENCES users(id),
        content    TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_comments_post_id ON comments(post_id)`);
    await queryRunner.query(`CREATE INDEX idx_comments_user_id ON comments(user_id)`);

    // --- follows 表 ---
    await queryRunner.query(`
      CREATE TABLE follows (
        id           BIGSERIAL PRIMARY KEY,
        follower_id  BIGINT NOT NULL REFERENCES users(id),
        following_id BIGINT NOT NULL REFERENCES users(id),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT UQ_follows_pair UNIQUE (follower_id, following_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_follows_follower_id ON follows(follower_id)`);
    await queryRunner.query(`CREATE INDEX idx_follows_following_id ON follows(following_id)`);

    // --- gallery_photos 表 ---
    await queryRunner.query(`
      CREATE TABLE gallery_photos (
        id             BIGSERIAL PRIMARY KEY,
        user_id        BIGINT NOT NULL REFERENCES users(id),
        post_id        BIGINT REFERENCES posts(id),
        title          VARCHAR(200) NOT NULL,
        description    TEXT,
        image_url      VARCHAR(512) NOT NULL,
        original_url   VARCHAR(512),
        metadata       JSONB,
        status         VARCHAR(24) NOT NULL DEFAULT 'pending',
        points_awarded INT NOT NULL DEFAULT 0,
        like_count     INT NOT NULL DEFAULT 0,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_gallery_photos_user_id ON gallery_photos(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_gallery_photos_post_id ON gallery_photos(post_id)`);
    await queryRunner.query(`CREATE INDEX idx_gallery_photos_status ON gallery_photos(status)`);

    // --- events 表 ---
    await queryRunner.query(`
      CREATE TABLE events (
        id                  BIGSERIAL PRIMARY KEY,
        creator_id          BIGINT NOT NULL REFERENCES users(id),
        title               VARCHAR(200) NOT NULL,
        description         TEXT NOT NULL,
        start_time          TIMESTAMPTZ NOT NULL,
        end_time            TIMESTAMPTZ,
        location_type       VARCHAR(20) NOT NULL,
        location            VARCHAR(512),
        max_participants    INT,
        current_participants INT NOT NULL DEFAULT 0,
        status              VARCHAR(24) NOT NULL DEFAULT 'pending',
        is_official         BOOLEAN NOT NULL DEFAULT FALSE,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_events_creator_id ON events(creator_id)`);
    await queryRunner.query(`CREATE INDEX idx_events_status ON events(status)`);
    await queryRunner.query(`CREATE INDEX idx_events_start_time ON events(start_time)`);

    // --- event_signups 表 ---
    await queryRunner.query(`
      CREATE TABLE event_signups (
        id         BIGSERIAL PRIMARY KEY,
        event_id   BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id    BIGINT NOT NULL REFERENCES users(id),
        status     VARCHAR(20) NOT NULL DEFAULT 'signed',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT UQ_event_signup_pair UNIQUE (event_id, user_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_event_signups_event_id ON event_signups(event_id)`);
    await queryRunner.query(`CREATE INDEX idx_event_signups_user_id ON event_signups(user_id)`);

    // --- points_transactions 表 ---
    await queryRunner.query(`
      CREATE TABLE points_transactions (
        id              BIGSERIAL PRIMARY KEY,
        user_id         BIGINT NOT NULL REFERENCES users(id),
        type            VARCHAR(10) NOT NULL,
        amount          BIGINT NOT NULL,
        source          VARCHAR(30) NOT NULL,
        source_id       BIGINT,
        description     VARCHAR(200) NOT NULL,
        idempotency_key VARCHAR(64) NOT NULL UNIQUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_points_transactions_idempotency_key ON points_transactions(idempotency_key)`);

    // --- admin_logs 表 ---
    await queryRunner.query(`
      CREATE TABLE admin_logs (
        id          BIGSERIAL PRIMARY KEY,
        admin_id    BIGINT NOT NULL REFERENCES users(id),
        action      VARCHAR(50) NOT NULL,
        target_type VARCHAR(30) NOT NULL,
        target_id   BIGINT,
        detail      JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id)`);
    await queryRunner.query(`CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id)`);

    // --- fits_assets 表 ---
    await queryRunner.query(`
      CREATE TABLE fits_assets (
        id              BIGSERIAL PRIMARY KEY,
        job_id          UUID NOT NULL UNIQUE,
        post_id         BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id         BIGINT NOT NULL REFERENCES users(id),
        format          VARCHAR(16) NOT NULL,
        original_url    VARCHAR(512) NOT NULL,
        original_size   BIGINT NOT NULL,
        preview_url     VARCHAR(512),
        preview_size    BIGINT,
        metadata        JSONB,
        status          VARCHAR(24) NOT NULL DEFAULT 'pending',
        error           TEXT,
        retry_count     INT NOT NULL DEFAULT 0,
        idempotency_key VARCHAR(64) NOT NULL UNIQUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at    TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_fits_assets_post_id ON fits_assets(post_id)`);
    await queryRunner.query(`CREATE INDEX idx_fits_assets_user_id ON fits_assets(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_fits_assets_job_id ON fits_assets(job_id)`);
    await queryRunner.query(`CREATE INDEX idx_fits_assets_status ON fits_assets(status)`);

    // --- device_uploads 表 ---
    await queryRunner.query(`
      CREATE TABLE device_uploads (
        id         BIGSERIAL PRIMARY KEY,
        device_id  BIGINT,
        user_id    BIGINT NOT NULL REFERENCES users(id),
        file_url   VARCHAR(512) NOT NULL,
        file_type  VARCHAR(20) NOT NULL,
        metadata   JSONB,
        status     VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_device_uploads_user_id ON device_uploads(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_device_uploads_device_id ON device_uploads(device_id)`);

    // --- device_processing_tasks 表 ---
    await queryRunner.query(`
      CREATE TABLE device_processing_tasks (
        id          BIGSERIAL PRIMARY KEY,
        upload_id   BIGINT NOT NULL REFERENCES device_uploads(id),
        type        VARCHAR(30) NOT NULL,
        status      VARCHAR(20) NOT NULL DEFAULT 'pending',
        result      JSONB,
        error       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        finished_at TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_device_processing_tasks_upload_id ON device_processing_tasks(upload_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS device_processing_tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS device_uploads`);
    await queryRunner.query(`DROP TABLE IF EXISTS fits_assets`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS points_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS event_signups`);
    await queryRunner.query(`DROP TABLE IF EXISTS events`);
    await queryRunner.query(`DROP TABLE IF EXISTS gallery_photos`);
    await queryRunner.query(`DROP TABLE IF EXISTS follows`);
    await queryRunner.query(`DROP TABLE IF EXISTS comments`);
    await queryRunner.query(`DROP TABLE IF EXISTS posts`);
    await queryRunner.query(`DROP TABLE IF EXISTS sections`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
