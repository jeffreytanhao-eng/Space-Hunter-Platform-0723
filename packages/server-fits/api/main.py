"""
太空猎人 - FITS处理服务 FastAPI 入口
"""
from fastapi import FastAPI

app = FastAPI(title="Space Hunter FITS Service", version="0.1.0")


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok", "service": "space-hunter-fits"}
