﻿# 太空猎人 - FITS 天文数据处理 Worker Dockerfile
# 单阶段构建 - 直接安装依赖

FROM python:3.11-slim

WORKDIR /app

# 使用国内镜像源加速 apt-get
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list 2>/dev/null; \
    apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖（使用国内镜像源）
COPY requirements.txt .
RUN pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt

# 创建非 root 用户
RUN useradd --create-home appuser

# 复制项目代码
COPY --chown=appuser:appuser . .

USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# 启动服务
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]