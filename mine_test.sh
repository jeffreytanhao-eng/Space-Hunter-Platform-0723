#!/bin/bash
# 复现"我的活动"问题
set -e
BASE="https://localhost/api"
UNAME="flowtest_user"
UPAAS="FlowTest@123"
ANAME="flowtest_admin"
APAAS="AdminTest@123"

UHASH=$(docker exec spacehunter-backend-1 node -e "const bcrypt=require('bcrypt');console.log(bcrypt.hashSync(process.argv[1],10))" "$UPAAS")
AHASH=$(docker exec spacehunter-backend-1 node -e "const bcrypt=require('bcrypt');console.log(bcrypt.hashSync(process.argv[1],10))" "$APAAS")
printf "INSERT INTO users (username,nickname,role,status,password) VALUES ('%s','流程测试用户','user','active','%s'),('%s','流程测试管理员','admin','active','%s') ON CONFLICT (username) DO UPDATE SET password=EXCLUDED.password,role=EXCLUDED.role,status='active',nickname=EXCLUDED.nickname;\n" "$UNAME" "$UHASH" "$ANAME" "$AHASH" | docker exec -i spacehunter-postgres-1 psql -U postgres -d space_hunter -v ON_ERROR_STOP=1 >/dev/null

UTOK=$(curl -sk -X POST "$BASE/auth/login-password" -H 'Content-Type: application/json' -d "{\"username\":\"$UNAME\",\"password\":\"$UPAAS\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
ATOK=$(curl -sk -X POST "$BASE/auth/login-password" -H 'Content-Type: application/json' -d "{\"username\":\"$ANAME\",\"password\":\"$APAAS\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

echo "用户ID:"
docker exec spacehunter-postgres-1 psql -U postgres -d space_hunter -t -c "SELECT id FROM users WHERE username='$UNAME'" | tr -d ' \n'
echo ""

EID=$(curl -sk -X POST "$BASE/events" -H 'Content-Type: application/json' -H "Authorization: Bearer $UTOK" -d '{"title":"mine测试-星空露营","description":"mine测试","startTime":"2026-09-02T10:00:00Z","locationType":"online"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "event id=$EID"
curl -sk -X PUT "$BASE/admin/events/$EID/review" -H 'Content-Type: application/json' -H "Authorization: Bearer $ATOK" -d '{"status":"approved"}' >/dev/null
curl -sk -X POST "$BASE/events/$EID/signup" -H 'Content-Type: application/json' -H "Authorization: Bearer $UTOK" >/dev/null

echo "== DB 中 signup 记录 =="
docker exec spacehunter-postgres-1 psql -U postgres -d space_hunter -c "SELECT id, event_id, user_id, status FROM event_signups WHERE event_id=$EID;"
echo "== users.id 类型 =="
docker exec spacehunter-postgres-1 psql -U postgres -d space_hunter -c "SELECT id, username FROM users WHERE username='$UNAME';"
echo "== GET /events/mine 原始响应 =="
curl -sk "$BASE/events/mine" -H "Authorization: Bearer $UTOK"
echo ""
echo "== 清理 =="
docker exec spacehunter-postgres-1 psql -U postgres -d space_hunter -c "DELETE FROM event_signups WHERE event_id=$EID; DELETE FROM events WHERE id=$EID;" >/dev/null
echo "done"
