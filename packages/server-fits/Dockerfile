# 太空猎人 - FITS 天文数据处理 Worker Dockerfile
# 两阶段构建：编译依赖 → 精简运行

# ============ 阶段1: 编译阶段 ============
FROM python:3.11-slim AS builder

WORKDIR /app

# 安装编译依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ============ 阶段2: 运行阶段 ============
FROM python:3.11-slim AS runner

WORKDIR /app

# 从编译阶段复制已安装的 Python 包
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# 创建非 root 用户
RUN useradd --create-home appuser
USER appuser

# 复制项目代码
COPY --chown=appuser:appuser . .

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# 启动服务
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
