"""
星点检测模块：从天文图像中自动提取恒星位置。

使用 photutils 的 DAOStarFinder（基于背景估计 + 高斯拟合），
返回星点列表 [(x, y, flux, mag), ...]。
"""

from __future__ import annotations

import logging

import numpy as np

logger = logging.getLogger(__name__)


def detect_stars(data: np.ndarray, snr_threshold: float = 5.0,
                 fwhm: float = 3.0, brightest: int = 300,
                 min_sep: float = 5.0) -> list[dict]:
    """
    从 2D 图像中检测恒星。

    参数：
        data: 2D 灰度图像数组
        snr_threshold: 检测信噪比阈值
        fwhm: 估计的星点半高全宽（像素）
        brightest: 保留最亮的 N 颗星
        min_sep: 最小间距（像素），用于稀疏化

    返回：按流量降序的星点列表 [{"x":..,"y":..,"flux":..,"mag":..}, ...]
    """
    from photutils.detection import DAOStarFinder
    from astropy.stats import sigma_clipped_stats

    # 背景估计
    mean, median, std = sigma_clipped_stats(data, sigma=3.0, maxiters=5)

    # 背景减除
    data_sub = data - median

    finder = DAOStarFinder(
        threshold=snr_threshold * std,
        fwhm=fwhm,
        exclude_border=True,
    )
    sources = finder(data_sub)

    if sources is None or len(sources) == 0:
        return []

    flux = np.asarray(sources["flux"], dtype=float)
    x = np.asarray(sources["xcentroid"], dtype=float)
    y = np.asarray(sources["ycentroid"], dtype=float)

    # 按亮度降序，再按最小间距稀疏化（兼容 photutils 3.0 移除相关参数的差异）
    order = np.argsort(-flux)
    stars = []
    selected_coords = []  # (x, y)
    for i in order:
        xi, yi = float(x[i]), float(y[i])
        if all(((xi - sx) ** 2 + (yi - sy) ** 2) >= min_sep ** 2
               for sx, sy in selected_coords):
            flux_i = float(flux[i])
            selected_coords.append((xi, yi))
            stars.append({
                "x": xi,
                "y": yi,
                "flux": flux_i,
                "mag": float(-2.5 * np.log10(max(flux_i, 1e-12))),
            })
            if len(stars) >= brightest:
                break
    return stars


def synthesize_stars(width: int, height: int, count: int = 200,
                     seed: int = 42) -> tuple[np.ndarray, list[dict]]:
    """
    生成用于测试/验证的合成星图。
    返回 (图像数组, 真实星点列表)。
    """
    rng = np.random.default_rng(seed)
    img = np.zeros((height, width), dtype=np.float64)
    stars = []
    margin = 30
    for _ in range(count):
        while True:
            x = rng.uniform(margin, width - margin)
            y = rng.uniform(margin, height - margin)
            # 避免过近
            if all(((x - s["x"]) ** 2 + (y - s["y"]) ** 2) > 144 for s in stars):
                break
        flux = rng.uniform(200, 2000)
        # 高斯 PSF
        yy, xx = np.mgrid[0:height, 0:width]
        img += flux * np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * 2.0 ** 2))
        stars.append({"x": x, "y": y, "flux": flux})
    # 加背景 + 噪声
    img += 100.0
    img += rng.normal(0, 3.0, size=img.shape)
    return img, stars