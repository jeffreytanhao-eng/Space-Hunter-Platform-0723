"""
大图恢复模块：将增强/压缩后的图像恢复到原始分辨率。

背景：火山等增强服务有输入尺寸限制（如 2048px），会先缩放大图。
本模块在增强完成后，用高质量插值（LANCZOS）把结果放大回原始分辨率，
保证"压缩、渲染之后仍能输出大图"。
"""

from __future__ import annotations

import logging

from PIL import Image

logger = logging.getLogger(__name__)


def restore_to_original(enhanced_path: str, origin_width: int, origin_height: int,
                        output_path: str, resample: int = Image.LANCZOS) -> str:
    """
    将增强后的图像恢复到原始分辨率。

    参数：
        enhanced_path: 增强后的图像路径
        origin_width:  原始宽度（像素）
        origin_height: 原始高度（像素）
        output_path:   输出文件路径
        resample:      插值算法（默认 LANCZOS）

    返回：输出路径
    """
    img = Image.open(enhanced_path)
    img = img.convert("RGB")

    # 若增强结果尺寸未知，则按原始目标尺寸放大
    if img.size != (origin_width, origin_height):
        img = img.resize((int(origin_width), int(origin_height)), resample)

    img.save(output_path, quality=95)
    logger.info(
        "大图恢复完成: %s (%s -> %s)",
        output_path,
        enhanced_path,
        (origin_width, origin_height),
    )
    return output_path