#!/bin/bash
# 清理 flowtest 残留测试数据
set -e
echo "== 清理前 flowtest 用户 =="
docker exec spacehunter-postgres-1 psql -U postgres -d space_hunter -c "SELECT id, username, role FROM users WHERE username LIKE 'flowtest%' ORDER BY id;"

echo "== 删除关联数据 =="
docker exec spacehunter-postgres-1 psql -U postgres -d space_hunter -v ON_ERROR_STOP=1 <<'SQL'
-- 删除 flowtest 用户的活动相关数据
DELETE FROM event_signups WHERE event_id IN (SELECT id FROM events WHERE creator_id IN (SELECT id FROM users WHERE username LIKE 'flowtest%'));
DELETE FROM events WHERE creator_id IN (SELECT id FROM users WHERE username LIKE 'flowtest%');
-- 删除 admin_logs 中引用 flowtest 用户的记录（admin_id / 或其他外键列）
DELETE FROM admin_logs WHERE admin_id IN (SELECT id FROM users WHERE username LIKE 'flowtest%');
-- 删除用户
DELETE FROM users WHERE username LIKE 'flowtest%';
SQL
echo "== 清理后 =="
docker exec spacehunter-postgres-1 psql -U postgres -d space_hunter -c "SELECT id, username FROM users WHERE username LIKE 'flowtest%';"
echo "清理完成"
