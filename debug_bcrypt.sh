#!/bin/bash
# 调试 bcrypt 密码比较
UNAME="flowtest_user"
UPAAS="FlowTest@123"
echo "== 读取存储哈希 =="
STORED=$(docker exec spacehunter-postgres-1 psql -U postgres -d space_hunter -t -c "SELECT password FROM users WHERE username='$UNAME'" | tr -d ' \n')
echo "stored hash: $STORED"
echo "stored len: ${#STORED}"
echo "== 重新生成并比较 =="
docker exec spacehunter-backend-1 node -e 'const bcrypt=require("bcrypt");const p=process.argv[1];const h=process.argv[2];console.log("regen:",bcrypt.hashSync(p,10).slice(0,7));console.log("compare:",bcrypt.compareSync(p,h))' "$UPAAS" "$STORED"
echo "== 后端容器内 bcrypt 是否可加载 / node 版本 =="
docker exec spacehunter-backend-1 node --version
