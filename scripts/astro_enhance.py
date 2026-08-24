#!/usr/bin/env python3
"""
天文图像保真增强脚本（双模式）
- style=classic（经典天文模式）: 二次曲面去背景梯度 + 固定残差 asinh 拉伸 + 分条带全分辨率
- style=smart（智能增强模式）  : photutils.Background2D 去背景 + ZScale 自动拉伸
两种模式共用 astroscrappy 宇宙线去除 + YCbCr 亮度空间处理（避免色噪声）

依赖: pillow, numpy, scipy, astropy, photutils, astroscrappy
安装: pip install pillow numpy scipy astropy photutils astroscrappy
"""

import argparse
import time

import numpy as np
from PIL import Image

# 允许处理超大图像
Image.MAX_IMAGE_PIXELS = None


# ---------- 通用工具 ----------
def rgb_to_ycbcr(img: np.ndarray):
    """RGB(float32 HxWx3) -> (Y, Cb, Cr)，ITU-R BT.601"""
    y = 0.299 * img[:, :, 0] + 0.587 * img[:, :, 1] + 0.114 * img[:, :, 2]
    cb = -0.168736 * img[:, :, 0] - 0.331264 * img[:, :, 1] + 0.5 * img[:, :, 2] + 128.0
    cr = 0.5 * img[:, :, 0] - 0.418688 * img[:, :, 1] - 0.081312 * img[:, :, 2] + 128.0
    return y, cb, cr


def ycbcr_to_rgb(y: np.ndarray, cb: np.ndarray, cr: np.ndarray) -> np.ndarray:
    """YCbCr -> RGB (BT.601 逆变换)，返回 uint8 HxWx3"""
    r = y + 1.402 * (cr - 128.0)
    g = y - 0.344136 * (cb - 128.0) - 0.714136 * (cr - 128.0)
    b = y + 1.772 * (cb - 128.0)
    return np.clip(np.stack([r, g, b], axis=-1), 0, 255).astype(np.uint8)


def rgb_to_gray(rgb: np.ndarray) -> np.ndarray:
    """RGB 转灰度（人眼感知权重），用于宇宙线检测"""
    return 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]


def remove_cosmics_1ch(arr: np.ndarray, sigclip: float, objlim: float,
                       niter: int = 4) -> np.ndarray:
    """对 2D 单通道用 astroscrappy 做宇宙线检测与中值替换"""
    from astroscrappy import detect_cosmics
    from scipy.ndimage import median_filter

    cr_mask, _ = detect_cosmics(
        arr.astype(np.float32),
        sigclip=sigclip,
        sigfrac=0.3,
        objlim=objlim,
        niter=niter,
        readnoise=10.0,
        gain=1.0,
    )
    if not np.any(cr_mask):
        return arr
    out = arr.copy()
    med = median_filter(out, size=3)
    out[cr_mask] = med[cr_mask]
    return out


def remove_cosmics_rgb(img: np.ndarray, sigclip: float = 4.5,
                       objlim: float = 5.0, niter: int = 4) -> np.ndarray:
    """对 RGB 图像做宇宙线去除（灰度检测 mask，逐通道中值替换）"""
    import numpy as np
    gray = rgb_to_gray(img).astype(np.float32)
    cr_mask, _ = __import__('astroscrappy').detect_cosmics(
        gray,
        sigclip=sigclip,
        sigfrac=0.3,
        objlim=objlim,
        niter=niter,
        readnoise=10.0,
        gain=1.0,
    )
    if not np.any(cr_mask):
        return img.astype(np.float32)
    from scipy.ndimage import median_filter
    print(f"  检测到宇宙线像素: {np.sum(cr_mask)} 个")
    result = img.astype(np.float32).copy()
    for i in range(3):
        ch = result[:, :, i]
        med = median_filter(ch, size=3)
        ch[cr_mask] = med[cr_mask]
        result[:, :, i] = ch
    return result


# ---------- 经典天文模式（二次曲面 + 固定残差 asinh + 分条带全分辨率） ----------
def sample_background_gray(y: np.ndarray, patch: int = 24, step: int = 300):
    """在亮度图上采样背景中值点，用于拟合二次曲面"""
    h, w = y.shape
    xs = list(range(50, w - 50, step))
    ys = list(range(50, h - 50, step))
    samples = []
    for yy in ys:
        for xx in xs:
            med = np.median(y[yy:yy + patch, xx:xx + patch])
            samples.append((xx + patch / 2, yy + patch / 2, med))
    return np.array(samples)


def fit_quadratic_gray(samples: np.ndarray):
    """拟合亮度二次曲面: z = a*x² + b*y² + c*xy + d*x + e*y + f"""
    from scipy.linalg import lstsq
    x = samples[:, 0]
    y = samples[:, 1]
    X = np.c_[x**2, y**2, x * y, x, y, np.ones_like(x)]
    coef, *_ = lstsq(X, samples[:, 2])
    return coef


def upsample_by_strips(small: np.ndarray, target_h: int, target_w: int,
                       strip: int = 128) -> np.ndarray:
    """条带式放大：避免一次性放大超大图造成内存峰值"""
    sh, sw, _ = small.shape
    out = np.empty((target_h, target_w, 3), dtype=np.uint8)
    for y0 in range(0, target_h, strip):
        y1 = min(y0 + strip, target_h)
        s0 = int(y0 * sh / target_h)
        s1 = max(s0 + 1, int(y1 * sh / target_h))
        crop = small[s0:s1]
        band = Image.fromarray(crop, "RGB").resize((target_w, y1 - y0), Image.LANCZOS)
        out[y0:y1] = np.array(band)
    return out


def process_classic(arr: np.ndarray, beta: float, residual_ref: float,
                    strip_height: int, enable_cosmics: bool,
                    cosmics_sigclip: float, cosmics_objlim: float) -> np.ndarray:
    """经典天文模式：亮度二次曲面去梯度 + 固定残差 asinh 拉伸，分条带全分辨率"""
    h, w, _ = arr.shape
    y, cb, cr = rgb_to_ycbcr(arr)

    # 亮度二次曲面背景
    samples = sample_background_gray(y)
    a, b, c, d, e, f = fit_quadratic_gray(samples)
    print(f"  亮度二次曲面: a={a:.2e} b={b:.2e} c={c:.2e} d={d:.2e} e={e:.2e} f={f:.1f}")

    scale = 255.0 / np.arcsinh(residual_ref / beta)
    print(f"  拉伸: beta={beta}, residual_ref={residual_ref}")

    # 内存优化：避免创建全尺寸坐标网格，改为条带内按需生成坐标数组
    cols = np.arange(w, dtype=np.float32)
    out = np.empty((h, w, 3), dtype=np.uint8)

    for y0 in range(0, h, strip_height):
        y1 = min(y0 + strip_height, h)
        ys = y[y0:y1]
        rows = np.arange(y0, y1, dtype=np.float32).reshape(-1, 1)
        bg = a * cols**2 + b * rows**2 + c * cols * rows + d * cols + e * rows + f
        resid = np.maximum(ys - bg, 0.0)  # 负残差置零，背景干净
        if enable_cosmics:
            resid = remove_cosmics_1ch(resid, cosmics_sigclip, cosmics_objlim)
        stretched = np.clip(np.arcsinh(resid / beta) * scale, 0, 255)
        out[y0:y1] = ycbcr_to_rgb(stretched, cb[y0:y1], cr[y0:y1])
    return out


# ---------- 智能增强模式（Background2D + ZScale 自动拉伸） ----------
def subtract_background_rgb(img: np.ndarray, box_size: int = 128,
                            filter_size: int = 3) -> np.ndarray:
    """photutils.Background2D 网格化背景估计，逐通道减去"""
    from photutils.background import Background2D, MedianBackground

    bkg_estimator = MedianBackground()
    result = np.zeros_like(img, dtype=np.float32)
    for i in range(3):
        ch = img[:, :, i].astype(np.float32)
        try:
            bkg = Background2D(
                ch,
                box_size=(box_size, box_size),
                filter_size=(filter_size, filter_size),
                bkg_estimator=bkg_estimator,
            )
            result[:, :, i] = np.maximum(ch - bkg.background, 0.0)
        except Exception as e:
            print(f"  通道 {i} Background2D 失败，退化为全局中值: {e}")
            bg = np.median(ch)
            result[:, :, i] = np.maximum(ch - bg, 0.0)
    return result


def stretch_image_rgb(img: np.ndarray, stretch_type: str = "asinh",
                      zscale_contrast: float = 0.25,
                      asinh_a: float = 0.5) -> np.ndarray:
    """天文图像温和增强：背景中位数抑制 + asinh 拉伸；YCbCr 亮度空间处理避免色噪声"""
    from scipy.ndimage import median_filter

    y, cb, cr = rgb_to_ycbcr(img)
    y_denoised = median_filter(y, size=3)

    bg = float(np.median(y_denoised))
    print(f"  背景估计: {bg:.1f}")

    vmax = float(np.percentile(y_denoised, 99.9))
    span = max(vmax - bg, 1e-6)
    t = np.clip((y_denoised - bg) / span, 0.0, 1.0)

    if stretch_type == "asinh":
        a = max(asinh_a, 0.05)
        stretched = np.arcsinh(t / a) / float(np.arcsinh(1.0 / a))
    elif stretch_type == "log":
        stretched = np.log1p(t * (np.e - 1))
    elif stretch_type == "sqrt":
        stretched = np.sqrt(t)
    else:
        stretched = t

    y_stretched = np.clip(stretched, 0.0, 1.0) * 255.0
    cb_out = median_filter(cb, size=3)
    cr_out = median_filter(cr, size=3)
    return ycbcr_to_rgb(y_stretched, cb_out, cr_out)


def process_smart(img: np.ndarray, box_size: int, zscale_contrast: float,
                  asinh_a: float, stretch: str, enable_cosmics: bool,
                  cosmics_sigclip: float, cosmics_objlim: float) -> np.ndarray:
    """智能增强模式：Background2D 去背景 + 宇宙线 + ZScale/asinh 拉伸"""
    print("步骤 1/3: 网格化背景去除 (photutils.Background2D)...")
    t0 = time.time()
    arr = subtract_background_rgb(img, box_size=box_size)
    print(f"  完成 ({time.time() - t0:.1f}s)")

    if enable_cosmics:
        print("步骤 2/3: 宇宙线检测与去除 (astroscrappy)...")
        t0 = time.time()
        arr = remove_cosmics_rgb(arr, sigclip=cosmics_sigclip, objlim=cosmics_objlim)
        print(f"  完成 ({time.time() - t0:.1f}s)")
    else:
        print("步骤 2/3: 宇宙线去除（已跳过）")

    print("步骤 3/3: 拉伸 (背景抑制 + asinh)...")
    t0 = time.time()
    out = stretch_image_rgb(arr, stretch_type=stretch, asinh_a=asinh_a)
    print(f"  完成 ({time.time() - t0:.1f}s)")
    return out


# ---------- 主流程 ----------
def process_image(
    input_path: str,
    output_path: str,
    style: str = "classic",
    box_size: int = 128,
    zscale_contrast: float = 0.25,
    asinh_a: float = 0.5,
    stretch: str = "asinh",
    beta: float = 4.0,
    residual_ref: float = 50.0,
    strip_height: int = 256,
    enable_cosmics: bool = True,
    cosmics_sigclip: float = 4.5,
    cosmics_objlim: float = 5.0,
    quality: int = 92,
):
    start = time.time()
    print(f"读取图像: {input_path}")
    img = Image.open(input_path).convert("RGB")
    w, h = img.size
    print(f"尺寸: {w} x {h}  模式: {style}")

    if style == "classic":
        # 经典天文模式：分条带处理；超大图降采样保护（内存兜底）
        CLASSIC_MAX_PIXELS = 12_000_000
        scale_down = 1.0
        if w * h > CLASSIC_MAX_PIXELS:
            scale_down = (CLASSIC_MAX_PIXELS / (w * h)) ** 0.5
            new_w = max(1, int(w * scale_down))
            new_h = max(1, int(h * scale_down))
            print(f"  超大图保护: {w}x{h} 降采样到 {new_w}x{new_h} 处理")
            img = img.resize((new_w, new_h), Image.LANCZOS)
            w, h = new_w, new_h
        arr = np.array(img, dtype=np.float32)
        del img
        out_arr = process_classic(
            arr, beta, residual_ref, strip_height,
            enable_cosmics, cosmics_sigclip, cosmics_objlim,
        )
        if scale_down < 1.0:
            orig_w = Image.open(input_path).convert("RGB").size[0]
            orig_h = Image.open(input_path).convert("RGB").size[1]
            print(f"  恢复原尺寸: {orig_w} x {orig_h}（条带放大）")
            out_arr = upsample_by_strips(out_arr, orig_h, orig_w)
    else:
        # 智能增强模式：超大图内存保护（降采样处理再放大）
        MAX_PIXELS = 10_000_000
        scale_down = 1.0
        if w * h > MAX_PIXELS:
            scale_down = (MAX_PIXELS / (w * h)) ** 0.5
            new_w = max(1, int(w * scale_down))
            new_h = max(1, int(h * scale_down))
            print(f"  超大图保护: {w}x{h} 降采样到 {new_w}x{new_h} 处理")
            img = img.resize((new_w, new_h), Image.LANCZOS)
            w, h = new_w, new_h
        arr = np.array(img, dtype=np.float32)
        del img
        out_arr = process_smart(
            arr, box_size, zscale_contrast, asinh_a, stretch,
            enable_cosmics, cosmics_sigclip, cosmics_objlim,
        )
        if scale_down < 1.0:
            orig_w = Image.open(input_path).convert("RGB").size[0]
            orig_h = Image.open(input_path).convert("RGB").size[1]
            print(f"  恢复原尺寸: {orig_w} x {orig_h}（条带放大）")
            out_arr = upsample_by_strips(out_arr, orig_h, orig_w)

    out_img = Image.fromarray(out_arr, mode="RGB")
    out_img.save(output_path, quality=quality, optimize=True, progressive=True)
    print(f"完成！总耗时 {time.time() - start:.1f}s")
    print(f"输出: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="天文图像保真增强（经典二次曲面 / 智能 Background2D 双模式）"
    )
    parser.add_argument("input_path", help="输入图片路径 (JPEG/PNG)")
    parser.add_argument("-o", "--output", required=True, help="输出图片路径")
    parser.add_argument(
        "--style",
        choices=["classic", "smart"],
        default="classic",
        help="处理模式: classic=经典天文模式(二次曲面+固定残差), smart=智能增强模式(Background2D+ZScale)",
    )

    # 经典模式参数
    parser.add_argument("--beta", type=float, default=4.0, help="经典: asinh 拉伸强度，越小暗部提升越强")
    parser.add_argument("--residual-ref", type=float, default=50.0, help="经典: 残差参考值")
    parser.add_argument("--strip", type=int, default=256, help="经典: 条带高度")

    # 智能模式参数
    parser.add_argument("--box-size", type=int, default=128, help="智能: Background2D 网格大小")
    parser.add_argument("--zscale-contrast", type=float, default=0.25, help="智能: 对比度")
    parser.add_argument("--asinh-a", type=float, default=0.5, help="智能: asinh 拉伸强度")
    parser.add_argument(
        "--stretch",
        choices=["asinh", "log", "sqrt", "linear"],
        default="asinh",
        help="智能: 拉伸方式",
    )

    # 共用参数
    parser.add_argument("--no-cosmics", action="store_true", help="禁用宇宙线去除")
    parser.add_argument("--cosmics-sigclip", type=float, default=4.5, help="宇宙线 sigma 阈值")
    parser.add_argument("--cosmics-objlim", type=float, default=5.0, help="宇宙线 objlim 参数")
    parser.add_argument("--quality", type=int, default=92, help="JPEG 输出质量")

    args = parser.parse_args()

    process_image(
        input_path=args.input_path,
        output_path=args.output,
        style=args.style,
        box_size=args.box_size,
        zscale_contrast=args.zscale_contrast,
        asinh_a=args.asinh_a,
        stretch=args.stretch,
        beta=args.beta,
        residual_ref=args.residual_ref,
        strip_height=args.strip,
        enable_cosmics=not args.no_cosmics,
        cosmics_sigclip=args.cosmics_sigclip,
        cosmics_objlim=args.cosmics_objlim,
        quality=args.quality,
    )


if __name__ == "__main__":
    main()