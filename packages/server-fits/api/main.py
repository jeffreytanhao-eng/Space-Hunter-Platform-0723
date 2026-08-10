"""
太空猎人 - FITS处理服务 FastAPI 入口
提供：健康检查、天文定位（Gaia 盲解算）、大图恢复。
"""

from __future__ import annotations

import logging
import os
import tempfile

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from PIL import Image

from astrometry import solve_image, solve_fits, restore_to_original, GaiaLiteCatalog

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("space-hunter-fits")

app = FastAPI(title="Space Hunter FITS Service", version="0.2.0")

# 单例：加载自托管 Gaia 子星表
_catalog: GaiaLiteCatalog | None = None


def _get_catalog() -> GaiaLiteCatalog:
    global _catalog
    if _catalog is None:
        _catalog = GaiaLiteCatalog()
        _catalog.load()
        if not _catalog.is_loaded:
            logger.warning("未找到 Gaia 子星表 data/gaia_lite.csv，定位功能不可用")
    return _catalog


@app.get("/health")
async def health_check():
    cat = _get_catalog()
    return {
        "status": "ok",
        "service": "space-hunter-fits",
        "gaia_catalog_loaded": cat.is_loaded,
        "gaia_catalog_size": cat.size() if cat.is_loaded else 0,
    }


def _to_2d(blob: bytes) -> np.ndarray:
    """将上传的图片字节转为 2D 灰度数组。"""
    img = Image.open(__import__("io").BytesIO(blob))
    img = img.convert("L")
    arr = np.asarray(img, dtype=np.float64)
    if arr.ndim == 3:
        arr = np.mean(arr, axis=2)
    return arr


@app.post("/solve")
async def solve(file: UploadFile = File(...), max_side: int = Form(1200)):
    """
    对上传的天文图片做盲解算（基于 Gaia 星表的自动星点匹配）。
    返回中心 RA/Dec、像素尺度、旋转角、匹配星点数。
    """
    cat = _get_catalog()
    if not cat.is_loaded:
        raise HTTPException(status_code=503, detail="Gaia 子星表未加载")

    blob = await file.read()
    if not blob:
        raise HTTPException(status_code=400, detail="空文件")

    data = _to_2d(blob)
    h, w = data.shape
    # 若过大，先降采样以加速星点检测（尺度会相应换算）
    base = max(w, h)
    if base > max_side:
        scale = max_side / base
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        tmp = Image.fromarray(data.astype(np.uint8)).resize((nw, nh), Image.LANCZOS)
        data_small = np.asarray(tmp, dtype=np.float64)
    else:
        data_small = data

    result = solve_image(data_small, cat)
    if not result.get("solved"):
        return {"solved": False, "error": result.get("error", "定位失败")}
    # 若降采样过，尺度换算回原始分辨率
    if base > max_side:
        result["scale_arcsec_per_pixel"] = result["scale_arcsec_per_pixel"] / scale
    result["original_size"] = [int(w), int(h)]
    return result


@app.post("/solve-fits")
async def solve_fits_upload(file: UploadFile = File(...)):
    """
    对上传的 FITS 文件做盲解算。
    """
    cat = _get_catalog()
    if not cat.is_loaded:
        raise HTTPException(status_code=503, detail="Gaia 子星表未加载")

    blob = await file.read()
    if not blob:
        raise HTTPException(status_code=400, detail="空文件")

    with tempfile.NamedTemporaryFile(suffix=".fits", delete=False) as tmp:
        tmp.write(blob)
        tmp_path = tmp.name
    try:
        result = solve_fits(tmp_path, cat)
    finally:
        os.unlink(tmp_path)

    if not result.get("solved"):
        return {"solved": False, "error": result.get("error", "定位失败")}
    return result


@app.post("/restore")
async def restore(file: UploadFile = File(...),
                  width: int = Form(...), height: int = Form(...)):
    """
    将增强后的图片恢复到原始分辨率（LANCZOS 高质量插值）。
    width/height 为原始目标分辨率。
    """
    blob = await file.read()
    if not blob:
        raise HTTPException(status_code=400, detail="空文件")
    if width <= 0 or height <= 0:
        raise HTTPException(status_code=400, detail="目标尺寸非法")

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(blob)
        tmp_path = tmp.name
    out_path = tmp_path.replace(".png", "_restored.png")
    try:
        restore_to_original(tmp_path, width, height, out_path)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    with open(out_path, "rb") as f:
        data = f.read()
    os.unlink(out_path)

    from fastapi.responses import Response
    return Response(content=data, media_type="image/png")