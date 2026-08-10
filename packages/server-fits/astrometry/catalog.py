"""
Gaia 子星表（自托管）加载模块。

自托管 Gaia 子星表：从 Gaia DR3 抽取的亮星/指定天区子集，以 CSV 形式随服务分发，
离线可用，符合项目"不使用外部云服务"的约束。

CSV 格式（列）：
    ra, dec, mag
    ra/dec 单位为十进制度，mag 为 G 波段视星等。

如需重建子星表，可运行 scripts/download_gaia.py 从 Gaia 档案 TAP 下载。
"""

import os
import csv
import math
import bisect

_DEFAULT_CATALOG = os.path.join(os.path.dirname(__file__), "..", "data", "gaia_lite.csv")


class GaiaLiteCatalog:
    """内存中的 Gaia 子星表，支持按天区 + 亮度范围查询。"""

    def __init__(self, path: str | None = None):
        path = path or _DEFAULT_CATALOG
        self.path = path
        self._ra = []          # 赤经（度）
        self._dec = []         # 赤纬（度）
        self._mag = []         # G 星等
        self._ra_sorted_idx = []  # 按 ra 排序的索引
        self._loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def load(self) -> bool:
        """加载 CSV 星表。返回是否成功。"""
        if not os.path.isfile(self.path):
            return False
        ra, dec, mag = [], [], []
        with open(self.path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                ra.append(float(row["ra"]))
                dec.append(float(row["dec"]))
                mag.append(float(row["mag"]))
        if not ra:
            return False
        self._ra, self._dec, self._mag = ra, dec, mag
        # 建立按 ra 排序的索引，便于天区范围查询
        self._ra_sorted_idx = sorted(range(len(ra)), key=lambda i: ra[i])
        self._loaded = True
        return True

    def size(self) -> int:
        return len(self._ra)

    def all_stars(self) -> list[tuple[float, float, float]]:
        """返回全部恒星 [(ra, dec, mag), ...]。"""
        if not self._loaded:
            return []
        return list(zip(self._ra, self._dec, self._mag))

    def brightest(self, n: int) -> list[tuple[float, float, float]]:
        """返回最亮的 n 颗恒星 [(ra, dec, mag), ...]（按 G 星等升序）。"""
        if not self._loaded or n <= 0:
            return []
        order = sorted(range(len(self._mag)), key=lambda i: self._mag[i])
        order = order[:n]
        return [(self._ra[i], self._dec[i], self._mag[i]) for i in order]

    def query_region(self, ra_center: float, dec_center: float, radius_deg: float,
                     max_mag: float = 99.0, min_mag: float = -99.0) -> list[tuple[float, float, float]]:
        """
        在指定天区（中心 + 半径，度）内按亮度查询恒星。
        返回 [(ra, dec, mag), ...]
        """
        if not self._loaded:
            return []
        # 用赤经范围粗筛：考虑赤经环绕 (-180,180] 或 (0,360]
        ra_min = ra_center - radius_deg
        ra_max = ra_center + radius_deg
        out = []
        cos_dec0 = math.cos(math.radians(dec_center))
        for idx in self._ra_sorted_idx:
            ra = self._ra[idx]
            if ra < ra_min or ra > ra_max:
                continue
            dec = self._dec[idx]
            if abs(dec - dec_center) > radius_deg:
                continue
            mag = self._mag[idx]
            if mag > max_mag or mag < min_mag:
                continue
            # 角距离校验（大圆弧）
            d = haversine_deg(ra_center, dec_center, ra, dec)
            if d <= radius_deg:
                out.append((ra, dec, mag))
        return out


def haversine_deg(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    """两坐标点间的角距离（度）。"""
    r1 = math.radians(ra1); d1 = math.radians(dec1)
    r2 = math.radians(ra2); d2 = math.radians(dec2)
    dlat = d2 - d1
    dlon = r2 - r1
    a = math.sin(dlat / 2) ** 2 + math.cos(d1) * math.cos(d2) * math.sin(dlon / 2) ** 2
    return math.degrees(2 * math.asin(math.sqrt(a)))