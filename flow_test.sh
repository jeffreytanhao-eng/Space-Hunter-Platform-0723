#!/bin/bash
# 活动全流程测试脚本（服务器端运行）
set -e

BASE="https://localhost/api"
UNAME="flowtest_user"
UPAAS="FlowTest@123"
ANAME="flowtest_admin"
APAAS="AdminTest@123"

echo "== 1. 生成测试账号密码哈希 =="
UHASH=$(docker exec spacehunter-backend-1 node -e "const bcrypt=require('bcrypt');console.log(bcrypt.hashSync(process.argv[1],10))" "$UPAAS")
AHASH=$(docker exec spacehunter-backend-1 node -e "const bcrypt=require('bcrypt');console.log(bcrypt.hashSync(process.argv[1],10))" "$APAAS")
echo "user hash len=${#UHASH}, admin hash len=${#AHASH}"

echo "== 2. 创建/更新测试用户（UPSERT） =="
printf "INSERT INTO users (username, nickname, role, status, password) VALUES ('%s','流程测试用户','user','active','%s'),('%s','流程测试管理员','admin','active','%s') ON CONFLICT (username) DO UPDATE SET password=EXCLUDED.password, role=EXCLUDED.role, status='active', nickname=EXCLUDED.nickname;\n" \
  "$UNAME" "$UHASH" "$ANAME" "$AHASH" \
  | docker exec -i spacehunter-postgres-1 psql -U postgres -d space_hunter -v ON_ERROR_STOP=1 >/dev/null
echo "测试账号已创建"

echo "== 3. 用户登录 =="
UTOK=$(curl -sk -X POST "$BASE/auth/login-password" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$UNAME\",\"password\":\"$UPAAS\"}")
echo "raw login resp: $UTOK"
UTOK=$(echo "$UTOK" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
echo "user token len=${#UTOK}"

echo "== 4. 管理员登录 =="
ATOK=$(curl -sk -X POST "$BASE/auth/login-password" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$ANAME\",\"password\":\"$APAAS\"}")
ATOK=$(echo "$ATOK" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
echo "admin token len=${#ATOK}"

echo "== 5. 用户发起活动 =="
CREATE_RESP=$(curl -sk -X POST "$BASE/events" -H 'Content-Type: application/json' -H "Authorization: Bearer $UTOK" \
  -d '{"title":"全流程测试活动-星系观测","description":"用于验证活动全流程的自动测试活动","startTime":"2026-09-01T10:00:00Z","endTime":"2026-09-01T18:00:00Z","locationType":"offline","location":"测试天文台","maxParticipants":10}')
echo "$CREATE_RESP"
EVENT_ID=$(echo "$CREATE_RESP" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "创建活动 id=$EVENT_ID"

echo "== 6. 审核前，该活动不在公开列表 =="
PUB_BEFORE=$(curl -sk "$BASE/events" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(any(str(x['id'])=='$EVENT_ID' for x in d))")
echo "公开列表包含该活动(应为False): $PUB_BEFORE"

echo "== 7. 管理员查看待审核列表 =="
PENDING=$(curl -sk "$BASE/admin/events/pending" -H "Authorization: Bearer $ATOK")
echo "$PENDING" | python3 -c "import sys,json;d=json.load(sys.stdin);items=d.get('data',d if isinstance(d,list) else []);print('待审核活动数:',len(items));print('包含新活动:',any(str(x.get('id'))=='$EVENT_ID' for x in items))"

echo "== 8. 管理员审核通过 =="
curl -sk -X PUT "$BASE/admin/events/$EVENT_ID/review" -H 'Content-Type: application/json' -H "Authorization: Bearer $ATOK" \
  -d '{"status":"approved"}'
echo ""

echo "== 9. 审核后，活动出现在公开列表 =="
PUB_AFTER=$(curl -sk "$BASE/events" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(any(str(x['id'])=='$EVENT_ID' for x in d))")
echo "公开列表包含该活动(应为True): $PUB_AFTER"

echo "== 10. 用户报名 =="
curl -sk -X POST "$BASE/events/$EVENT_ID/signup" -H 'Content-Type: application/json' -H "Authorization: Bearer $UTOK"
echo ""

echo "== 11. 报名后查询活动详情（参与者数） =="
curl -sk "$BASE/events/$EVENT_ID" | python3 -c "import sys,json;d=json.load(sys.stdin);print('currentParticipants:',d.get('currentParticipants'),'maxParticipants:',d.get('maxParticipants'),'status:',d.get('status'))"

echo "== 12. 我的活动 =="
curl -sk "$BASE/events/mine" -H "Authorization: Bearer $UTOK" | python3 -c "import sys,json;d=json.load(sys.stdin);items=d.get('data',d if isinstance(d,list) else []);print('我的活动数:',len(items));print('包含新活动:',any(str(x.get('id'))=='$EVENT_ID' for x in items))"

echo "== 13. 清理测试事件数据（保留可复用的测试账号） =="
printf "DELETE FROM event_signups WHERE event_id = %s;\nDELETE FROM events WHERE id = %s;\n" \
  "$EVENT_ID" "$EVENT_ID" \
  | docker exec -i spacehunter-postgres-1 psql -U postgres -d space_hunter -v ON_ERROR_STOP=1 >/dev/null
echo "测试事件已清理"

echo "== 全流程测试完成 =="
