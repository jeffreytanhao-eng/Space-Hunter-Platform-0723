"""
从 Gaia 档案 TAP 下载 Gaia 子星表，生成自托管的 CSV 星表。

用法：
    python download_gaia.py --center 120,30 --radius 5     # 下载指定天区
    python download_gaia.py --maxm 14 --allsky             # 下载全天亮星子集（耗时较长）

默认 TAP 端点：https://gea.esac.esa.int/tap-server/tap/sync
输出：data/gaia_lite.csv（表头 ra, dec, mag）

注意：该脚本需要外网访问 ESA Gaia 档案，仅在需要重建子星表时运行一次；
运行时服务直接读取 data/gaia_lite.csv，不依赖外网。
"""

import argparse
import csv
import os
import sys
import urllib.parse
import urllib.request

DEFAULT_TAP = "https://gea.esac.esa.int/tap-server/tap/sync"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def query_tap(query: str, tap_url: str = DEFAULT_TAP) -> str:
    """执行 TAP 同步查询，返回 CSV 文本。"""
    params = urllib.parse.urlencode({"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": query})
    req = urllib.request.Request(f"{tap_url}?{params}", headers={"User-Agent": "space-hunter"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read().decode("utf-8")


def write_csv(text: str, out_path: str) -> None:
    """写入 CSV，仅保留 ra,dec,mag 三列（丢弃 source_id），过滤 # 注释。"""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    rows = []
    for line in text.splitlines():
        if not line or line.startswith("#") or line.startswith("source_id"):
            continue
        parts = line.split(",")
        if parts and parts[0].strip().lower() == "ra":
            continue  # 跳过重复表头
        if len(parts) >= 4:
            # 原始行: source_id,ra,dec,mag
            rows.append(f"{parts[1]},{parts[2]},{parts[3]}")
        elif len(parts) >= 3:
            rows.append(f"{parts[0]},{parts[1]},{parts[2]}")
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        f.write("ra,dec,mag\n")
        f.write("\n".join(rows) + "\n")
    print(f"已写入: {out_path}（{len(rows)} 颗星）")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--center", help="中心坐标 'ra,dec'（度）")
    ap.add_argument("--radius", type=float, default=5.0, help="天区半径（度）")
    ap.add_argument("--maxm", type=float, default=16.0, help="最暗星等")
    ap.add_argument("--allsky", action="store_true", help="全天模式（按赤纬带分块）")
    ap.add_argument("--decband", type=float, default=10.0, help="全天下载的赤纬带宽度（度）")
    ap.add_argument("--out", default=os.path.join(OUT_DIR, "gaia_lite.csv"))
    args = ap.parse_args()

    if args.allsky:
        all_rows = []
        for dec0 in range(-90, 90, int(args.decband)):
            q = (
                "SELECT source_id, ra, dec, phot_g_mean_mag AS mag "
                f"FROM gaiadr3.gaia_source "
                f"WHERE phot_g_mean_mag < {args.maxm} "
                f"AND dec >= {dec0} AND dec < {dec0 + args.decband} "
                "ORDER BY phot_g_mean_mag"
            )
            print(f"下载赤纬带 {dec0}~{dec0+args.decband} ...", flush=True)
            text = query_tap(q)
            all_rows.append(text)
        merged = "# synthetic\nra,dec,mag\n"
        for t in all_rows:
            lines = [l for l in t.splitlines() if l and not l.startswith(("#", "source_id"))]
            merged += "\n".join(lines) + "\n"
        write_csv(merged, args.out)
        return

    ra, dec = args.center.split(",")
    q = (
        "SELECT source_id, ra, dec, phot_g_mean_mag AS mag "
        "FROM gaiadr3.gaia_source "
        f"WHERE phot_g_mean_mag < {args.maxm} "
        f"AND CONTAINS(POINT('ICRS', ra, dec), "
        f"CIRCLE('ICRS', {ra}, {dec}, {args.radius})) = 1 "
        "ORDER BY phot_g_mean_mag"
    )
    print("查询 Gaia 档案 ...", flush=True)
    text = query_tap(q)
    # 归一化表头
    lines = [l for l in text.splitlines() if l and not l.startswith("#")]
    header_idx = next(i for i, l in enumerate(lines) if l.startswith("source_id"))
    header = "ra,dec,mag\n"
    body = lines[header_idx + 1:]
    write_csv(header + "\n".join(body) + "\n", args.out)


if __name__ == "__main__":
    sys.exit(main())