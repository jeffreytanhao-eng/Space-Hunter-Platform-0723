#!/bin/bash
set -e

# 1. 安装清理脚本
cp /tmp/cleanup_docker.sh /root/cleanup_docker.sh
chmod +x /root/cleanup_docker.sh

# 2. 配置 systemd journal 大小上限（防止 journal 无限增长）
if grep -q '^SystemMaxUse' /etc/systemd/journald.conf; then
  sed -i 's/^SystemMaxUse.*/SystemMaxUse=100M/' /etc/systemd/journald.conf
else
  echo 'SystemMaxUse=100M' >> /etc/systemd/journald.conf
fi
systemctl restart systemd-journald 2>/dev/null || true

# 3. 安装 cron 任务：每天凌晨 3:15 自动清理（用 crontab，不依赖系统服务）
CRON_LINE="15 3 * * * /root/cleanup_docker.sh >/dev/null 2>&1"
( crontab -l 2>/dev/null | grep -v 'cleanup_docker.sh' ; echo "$CRON_LINE" ) | crontab -

echo "===== 已安装 cron 任务 ====="
crontab -l | grep cleanup_docker

echo "===== 立即执行一次清理 ====="
bash /root/cleanup_docker.sh
echo "===== 清理后磁盘状态 ====="
df -h /
