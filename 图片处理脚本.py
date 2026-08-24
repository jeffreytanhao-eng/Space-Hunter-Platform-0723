#!/usr/bin/env python3
"""
天文图像保真增强脚本
- 二次曲面背景梯度去除
- asinh 非线性拉伸
- 支持超大分辨率图像（分条带处理）

依赖: pillow, numpy, scipy
安装: pip install pillow numpy scipy
"""

import argparse
from pathlib import Path
import time

import numpy as np
from PIL import Image
from scipy.linalg import lstsq

# 允许处理超大图像
Image.MAX_IMAGE_PIXELS = None


def sample_background(img: Image.Image, patch_size: int = 24, step: int = 300):
    """采样背景中值点，用于拟合二次曲面"""
    w, h = img.size
    xs = list(range(50, w - 50, step))
    ys = list(range(50, h - 50, step))
    
    samples = []
    for y in ys:
        for x in xs:
            patch = np.array(img.crop((x, y, x + patch_size, y + patch_size)))
            med = np.median(patch.reshape(-1, 3), axis=0)
            samples.append((x + patch_size / 2, y + patch_size / 2, *med))
    
    return np.array(samples)


def fit_quadratic(samples: np.ndarray):
    """对 R/G/B 分别拟合二次曲面: z = a*x² + b*y² + c*xy + d*x + e*y + f"""
    x = samples[:, 0]
    y = samples[:, 1]
    X = np.c_[x**2, y**2, x * y, x, y, np.ones_like(x)]
    
    quads = {}
    for i, ch in enumerate(["R", "G", "B"]):
        z = samples[:, 2 + i]
        coef, *_ = lstsq(X, z)
        quads[ch] = coef
        print(f"  {ch}: a={coef[0]:.2e}  b={coef[1]:.2e}  c={coef[2]:.2e}  "
              f"d={coef[3]:.2e}  e={coef[4]:.2e}  f={coef[5]:.1f}")
    
    return quads


def process_image(
    input_path: str,
    output_path: str,
    beta: float = 4.0,
    residual_ref: float = 50.0,
    strip_height: int = 256,
    quality: int = 92,
):
    """
    主处理流程
    
    参数:
        beta          : asinh 拉伸强度，越小对暗部提升越强（推荐 3.0~6.0）
        residual_ref  : 用于映射到 255 的残差参考值
        strip_height  : 每次处理的行数，内存不足可调小
    """
    start = time.time()
    print(f"读取图像: {input_path}")
    img = Image.open(input_path)
    w, h = img.size
    print(f"尺寸: {w} × {h}")

    # 1. 采样并拟合二次曲面
    print("采样背景并拟合二次曲面...")
    samples = sample_background(img)
    quads = fit_quadratic(samples)

    # 2. 计算拉伸缩放系数
    scale = 255.0 / np.arcsinh(residual_ref / beta)
    print(f"拉伸参数: beta={beta}, residual_ref={residual_ref}, scale={scale:.2f}")

    # 3. 分条带处理
    print("开始分条带处理...")
    out = Image.new("RGB", (w, h))

    for y0 in range(0, h, strip_height):
        y1 = min(y0 + strip_height, h)
        strip = np.array(img.crop((0, y0, w, y1)), dtype=np.float32)
        
        yy, xx = np.mgrid[y0:y1, 0:w].astype(np.float32)

        for i, ch in enumerate(["R", "G", "B"]):
            a, b, c, d, e, f = quads[ch]
            # 二次曲面背景
            bg = a * xx**2 + b * yy**2 + c * xx * yy + d * xx + e * yy + f
            resid = strip[:, :, i] - bg
            resid = np.maximum(resid, 0.0)          # 负残差置零，背景更干净
            stretched = np.arcsinh(resid / beta) * scale
            strip[:, :, i] = np.clip(stretched, 0, 255)

        out.paste(Image.fromarray(strip.astype(np.uint8), "RGB"), (0, y0))

        if (y0 // strip_height) % 4 == 0:
            print(f"  进度: {y1}/{h}  ({time.time() - start:.1f}s)")

    # 4. 保存
    out.save(output_path, quality=quality, optimize=True, progressive=True)
    print(f"完成！耗时 {time.time() - start:.1f}s")
    print(f"输出: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="天文图像保真增强（去梯度 + asinh拉伸）")
    parser.add_argument("input", help="输入图像路径")
    parser.add_argument("-o", "--output", default=None, help="输出路径（默认在原文件名后加 _enhanced）")
    parser.add_argument("--beta", type=float, default=4.0, help="asinh 拉伸强度，越小暗部提升越强（默认 4.0）")
    parser.add_argument("--residual-ref", type=float, default=50.0, help="残差参考值（默认 50）")
    parser.add_argument("--strip", type=int, default=256, help="条带高度（内存不足可调小）")
    parser.add_argument("--quality", type=int, default=92, help="JPEG 质量 1-100")
    args = parser.parse_args()

    input_path = Path(args.input)
    if args.output is None:
        output_path = input_path.with_stem(input_path.stem + "_enhanced")
    else:
        output_path = Path(args.output)

    process_image(
        str(input_path),
        str(output_path),
        beta=args.beta,
        residual_ref=args.residual_ref,
        strip_height=args.strip,
        quality=args.quality,
    )


if __name__ == "__main__":
    main()