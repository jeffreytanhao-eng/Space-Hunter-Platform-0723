#!/bin/bash
# 太空猎人 - Docker 磁盘清理脚本（每天凌晨自动运行）
# 作用：防止构建缓存、容器日志、systemd journal 无限增长占满磁盘

LOG=/var/log/docker-cleanup.log
echo "===== $(date '+%Y-%m-%d %H:%M:%S') 开始清理 =====" >> "$LOG"

# 1. 清理 Docker 构建缓存（最大占用源，--no-cache 构建会持续累积）
docker builder prune -af -f >> "$LOG" 2>&1

# 2. 清理无标签(dangling)镜像与停止的容器（保留数据卷和正在使用的镜像）
docker image prune -f >> "$LOG" 2>&1
docker container prune -f >> "$LOG" 2>&1

# 3. 清理容器日志（json-file 日志，直接截断到 0，容器 fd 仍可继续写）
for c in $(docker ps -aq); do
  logpath=$(docker inspect --format='{{.LogPath}}' "$c" 2>/dev/null)
  if [ -n "$logpath" ] && [ -f "$logpath" ]; then
    truncate -s 0 "$logpath" 2>/dev/null
  fi
done

# 4. 限制 systemd journal 大小
journalctl --vacuum-size=50M >> "$LOG" 2>&1

echo "===== 清理完成 =====" >> "$LOG"
echo "" >> "$LOG"

# 输出当前磁盘状态
df -h / >> "$LOG" 2>&1
