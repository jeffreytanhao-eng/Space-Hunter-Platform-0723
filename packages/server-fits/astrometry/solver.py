"""
WCS 求解器：组合星点检测 + 三角形匹配 + RANSAC，
对天文图像进行盲解算，输出中心天体坐标、像素尺度、旋转角等。

支持：
    solve_image(data2d, catalog)  从 2D 图像数组定位
    solve_fits(file_path, catalog) 从 FITS 文件定位
"""

from __future__ import annotations

import logging

import numpy as np

from .star_detector import detect_stars
from .triangle_match import build_triangles, solve_via_triangles

logger = logging.getLogger(__name__)

# 匹配星表使用最亮的 N 颗亮星（亮星最可靠、三角形碰撞少、性能更好）
DEFAULT_BRIGHT_STARS = 15000


def _collect_correspondences(img_tris, cat_tris) -> tuple[np.ndarray, np.ndarray]:
    """指纹匹配，返回 (图像星点索引, 星表星点索引) 数组。"""
    img_by_fp: dict = {}
    for t in img_tris:
        img_by_fp.setdefault(t["fp"], []).append(t)
    cat_by_fp: dict = {}
    for t in cat_tris:
        cat_by_fp.setdefault(t["fp"], []).append(t)

    corr = []
    for fp, itris in img_by_fp.items():
        cts = cat_by_fp.get(fp)
        if not cts:
            continue
        for it in itris:
            for ct in cts:
                for m in range(3):
                    corr.append((it["idx"][m], ct["idx"][m]))
    corr = list(dict.fromkeys(corr))
    if not corr:
        return np.array([], dtype=int), np.array([], dtype=int)
    arr = np.array(corr)
    return arr[:, 0], arr[:, 1]


def solve_stars(img_stars: list[dict], cat_stars: list[tuple[float, float, float]],
                width: int, height: int, **kw) -> dict:
    """
    核心求解：给定图像星点与星表星点，返回定位结果 dict。
    img_stars: [{x,y,flux,mag}...]
    cat_stars: [(ra,dec,mag)...]
    """
    if len(img_stars) < 8:
        return {"solved": False, "error": "检测到的星点过少"}
    if len(cat_stars) < 8:
        return {"solved": False, "error": "星表内容过少"}

    img_pts = np.array([[s["x"], s["y"]] for s in img_stars], dtype=float)
    cat_pts = np.array([[ra, dec] for ra, dec, _mag in cat_stars], dtype=float)

    img_tris = build_triangles(img_pts)
    cat_tris = build_triangles(cat_pts)
    if not img_tris or not cat_tris:
        return {"solved": False, "error": "无法构建匹配三角形"}

    # 基于匹配三角形对直接求解候选变换，替代随机 RANSAC（高碰撞场景更稳定）
    from scipy.spatial import cKDTree
    cat_tree = cKDTree(cat_pts)
    res = solve_via_triangles(
        img_pts, img_tris, cat_pts, cat_tris, cat_tree,
        inlier_tol_deg=kw.get("inlier_tol_deg", 0.03),
        min_inliers=kw.get("min_inliers", 6),
        max_matches=kw.get("max_matches", 20000),
        tri_cap=kw.get("tri_cap", 20),
    )
    if res is None:
        return {"solved": False, "error": "三角形匹配未求解出稳定变换"}

    a, b, tx, ty = res["params"]
    scale_deg_pix = float(np.hypot(a, b))          # 度/像素
    scale_arcsec = scale_deg_pix * 3600.0           # 角秒/像素
    rotation = float(np.degrees(np.arctan2(b, a)))  # 度

    # 中心像素 -> 天体坐标
    cx, cy = width / 2.0, height / 2.0
    ra_c = a * cx - b * cy + tx
    dec_c = b * cx + a * cy + ty

    return {
        "solved": True,
        "ra": float(ra_c),
        "dec": float(dec_c),
        "scale_arcsec_per_pixel": scale_arcsec,
        "rotation_deg": rotation,
        "matched_stars": int(res["score"]),
        "width": int(width),
        "height": int(height),
        "parity_ok": bool(res["params"][0] != 0),
    }


def solve_image(data2d: np.ndarray, catalog, **kw) -> dict:
    """对 2D 天文图像做盲解算。"""
    h, w = data2d.shape[:2]
    stars = detect_stars(data2d,
                         snr_threshold=kw.get("snr_threshold", 5.0),
                         fwhm=kw.get("fwhm", 3.0),
                         brightest=kw.get("brightest", 300))
    # 使用亮星子集作为匹配星表：亮星最可靠、三角形碰撞少、性能更好
    bright_n = kw.get("bright_stars", DEFAULT_BRIGHT_STARS)
    cat_stars = catalog.brightest(bright_n) if catalog.is_loaded else []
    return solve_stars(stars, cat_stars, w, h, **kw)


def solve_fits(file_path: str, catalog, **kw) -> dict:
    """从 FITS 文件读取数据数组并定位。"""
    from astropy.io import fits
    with fits.open(file_path) as hdul:
        try:
            data = np.asarray(hdul[0].data)
        except Exception as e:  # noqa: BLE001
            return {"solved": False, "error": f"FITS 读取失败: {e}"}
    if data.ndim == 3:
        data = np.nanmean(data, axis=0)
    data = np.nan_to_num(data, nan=0.0, posinf=0.0, neginf=0.0)
    return solve_image(data, catalog, **kw)