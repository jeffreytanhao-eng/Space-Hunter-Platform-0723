"""
三角形指纹匹配：将图像星点与（局部）Gaia 星表星点进行匹配。

思路（受 astrometry.net 启发）：
1. 对每个星点取其最近的两个邻居构成三角形；
2. 用三条边长的归一化比例生成"指纹"（旋转/缩放不变）；
3. 以指纹为键，哈希匹配图像三角形与星表三角形；
4. 建立图像点 ↔ 星表点的候选对应；
5. 用 RANSAC 拟合相似变换（旋转+缩放+平移），取一致集最大者。
"""

from __future__ import annotations

import logging

import numpy as np
from scipy.spatial import cKDTree

logger = logging.getLogger(__name__)

FINGERPRINT_Q = 1000  # 指纹量化精度


def _sorted_vertices(pts: np.ndarray, idx: tuple) -> tuple:
    """根据边长排序，返回 (最长边A, 最长边B, 第三顶点C) 的坐标索引。"""
    i, j, k = idx
    p = pts[[i, j, k]]                       # 3x2
    d01 = float(np.hypot(*(p[0] - p[1])))
    d12 = float(np.hypot(*(p[1] - p[2])))
    d20 = float(np.hypot(*(p[2] - p[0])))
    # 边 (i,j),(j,k),(k,i) 的长度
    lens = {("i", "j"): d01, ("j", "k"): d12, ("k", "i"): d20}
    # 最长边
    longest = max(lens, key=lens.get)
    l1 = lens[longest]
    if l1 < 1e-9:
        return None
    edges = sorted(lens.values(), reverse=True)
    l2, l3 = edges[1], edges[2]
    if longest == ("i", "j"):
        a, b, c = i, j, k
    elif longest == ("j", "k"):
        a, b, c = j, k, i
    else:
        a, b, c = k, i, j
    fp = (int(round(l2 / l1 * FINGERPRINT_Q)), int(round(l3 / l1 * FINGERPRINT_Q)))
    return (a, b, c), fp


def build_triangles(pts: np.ndarray, k_nbr: int = 8) -> list[dict]:
    """
    为点集构建三角形。每个星点取其最近 k_nbr 个邻居，两两组合生成三角形，
    大幅提高指纹匹配机会。返回 [{idx:(a,b,c), fp, scale, coords}...]。
    """
    n = len(pts)
    if n < 3:
        return []
    tree = cKDTree(pts)
    tris = []
    for i in range(n):
        kk = min(k_nbr, n)
        dist, idx = tree.query(pts[i], k=kk + 1)  # 含自身
        neigh = np.atleast_1d(idx)[1:]
        if len(neigh) < 2:
            continue
        for p in range(len(neigh)):
            for q in range(p + 1, len(neigh)):
                j, l = int(neigh[p]), int(neigh[q])
                res = _sorted_vertices(pts, (i, j, l))
                if res is None:
                    continue
                (a, b, c), fp = res
                pa = pts[a]
                pb = pts[b]
                l1 = float(np.hypot(*(pa - pb)))
                tris.append({
                    "idx": (a, b, c),
                    "fp": fp,
                    "scale": l1,
                    "coords": pts[[a, b, c]],  # 3x2
                })
    return tris


def _solve_similarity(p1: np.ndarray, p2: np.ndarray) -> np.ndarray | None:
    """
    最小二乘拟合相似变换 p2 ≈ s*R(p1) + T。
    p1: (N,2) 源点（图像像素），p2: (N,2) 目标点（RA/Dec 度）。
    模型：u = a*x - b*y + tx;  v = b*x + a*y + ty
    返回 [a, b, tx, ty]。
    """
    p1 = np.asarray(p1, dtype=float)
    p2 = np.asarray(p2, dtype=float)
    n = len(p1)
    if n < 2:
        return None
    A = np.zeros((2 * n, 4))
    b = np.zeros(2 * n)
    for i in range(n):
        x, y = p1[i]
        u, v = p2[i]
        A[2 * i] = [x, -y, 1, 0]
        A[2 * i + 1] = [y, x, 0, 1]
        b[2 * i] = u
        b[2 * i + 1] = v
    try:
        sol, *_ = np.linalg.lstsq(A, b, rcond=None)
    except np.linalg.LinAlgError:
        return None
    return sol  # [a, b, tx, ty]


def _apply(p: np.ndarray, params: np.ndarray) -> np.ndarray:
    a, b, tx, ty = params
    x, y = p[:, 0], p[:, 1]
    u = a * x - b * y + tx
    v = b * x + a * y + ty
    return np.column_stack([u, v])


def solve_via_triangles(img_pts, img_tris, cat_pts, cat_tris, cat_tree,
                        inlier_tol_deg: float = 0.03, min_inliers: int = 6,
                        max_matches: int = 20000, tri_cap: int = 20) -> dict | None:
    """
    基于匹配三角形对求解相似变换（替代随机 RANSAC）。
    对每个指纹相同的 (图像三角形, 星表三角形) 对，用其 3 个对齐顶点直接解出
    候选相似变换，再用全局星表最近邻验证 inlier 数，取一致集最大者。

    优势：正确三角形对给出正确变换，inlier 显著高于错误碰撞对，无需随机采样。
    """
    img_by_fp: dict = {}
    for t in img_tris:
        img_by_fp.setdefault(t["fp"], []).append(t)
    cat_by_fp: dict = {}
    for t in cat_tris:
        cat_by_fp.setdefault(t["fp"], []).append(t)

    candidates = []
    for fp, itris in img_by_fp.items():
        cts = cat_by_fp.get(fp)
        if not cts:
            continue
        for it in itris:
            for ct in cts[:tri_cap]:
                ia = it["idx"]
                ca = ct["idx"]
                p_img = img_pts[[ia[0], ia[1], ia[2]]]
                p_cat = cat_pts[[ca[0], ca[1], ca[2]]]
                params = _solve_similarity(p_img, p_cat)
                if params is None:
                    continue
                candidates.append(params)
                if len(candidates) >= max_matches:
                    break
            if len(candidates) >= max_matches:
                break
        if len(candidates) >= max_matches:
            break

    if not candidates:
        return None

    best = None
    for params in candidates:
        proj = _apply(img_pts, params)
        dist, _ = cat_tree.query(proj)
        inliers = int(np.sum(dist < inlier_tol_deg))
        if best is None or inliers > best["score"]:
            best = {"params": params, "score": inliers}

    if best is None or best["score"] < min_inliers:
        return None
    return best


def ransac_solve(img_pts_img, corr_idx_img, cat_pts_cat, corr_idx_cat,
                 n_iters: int = 500, inlier_tol_deg: float = 0.02,
                 min_inliers: int = 6) -> dict | None:
    """
    在候选对应中 RANSAC 拟合相似变换。
    img_pts_img: (N,2) 图像星点坐标
    cat_pts_cat: (M,2) 星表 (ra,dec) 度
    corr_idx_img: (P,) 图像星点索引
    corr_idx_cat: (P,) 星表星点索引
    返回 {params, score, matches:[(img_idx,cat_idx)...]} 或 None。
    """
    P = len(corr_idx_img)
    if P < 3:
        return None
    img_src = img_pts_img[corr_idx_img]     # (P,2)
    cat_dst = cat_pts_cat[corr_idx_cat]     # (P,2)
    rng = np.random.default_rng(0)
    best = None
    for _ in range(n_iters):
        # 采样 2 对
        idx = rng.choice(P, size=min(2, P), replace=False)
        params = _solve_similarity(img_src[idx], cat_dst[idx])
        if params is None:
            continue
        # 计算全体验证
        proj = _apply(img_src, params)
        resid = np.hypot(proj[:, 0] - cat_dst[:, 0], proj[:, 1] - cat_dst[:, 1])
        inliers = np.where(resid < inlier_tol_deg)[0]
        if best is None or len(inliers) > best["score"]:
            best = {"params": params, "score": len(inliers), "inliers": list(inliers)}
        if best and best["score"] >= 20:
            break
    if best is None or best["score"] < min_inliers:
        return None
    # 用一致集重新拟合
    inl = np.array(best["inliers"])
    params = _solve_similarity(img_src[inl], cat_dst[inl])
    if params is None:
        params = best["params"]
    matches = [(int(corr_idx_img[i]), int(corr_idx_cat[i])) for i in inl]
    return {"params": params, "score": len(inl), "matches": matches}