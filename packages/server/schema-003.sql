CREATE TABLE IF NOT EXISTS check_ins (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  checkin_date VARCHAR(10) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT UQ_check_ins_user_date UNIQUE (user_id, checkin_date)
);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, checkin_date);

CREATE TABLE IF NOT EXISTS favorites (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  target_type VARCHAR(10) NOT NULL,
  target_id   BIGINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT UQ_favorites_triplet UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_target ON favorites(target_type, target_id);

CREATE TABLE IF NOT EXISTS conversations (
  id              BIGSERIAL PRIMARY KEY,
  user_a_id       BIGINT NOT NULL,
  user_b_id       BIGINT NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON conversations(user_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON conversations(user_b_id);

CREATE TABLE IF NOT EXISTS messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id       BIGINT NOT NULL,
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

CREATE TABLE IF NOT EXISTS notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  type        VARCHAR(20) NOT NULL,
  actor_id    BIGINT,
  target_type VARCHAR(10),
  target_id   BIGINT,
  content     VARCHAR(200) NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
