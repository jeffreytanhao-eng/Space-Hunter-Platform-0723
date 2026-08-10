"""
太空猎人 - 天文定位（astrometry）模块
提供基于 Gaia 星表的自动星点匹配（盲解算）与大图恢复能力。
"""

from .solver import solve_image, solve_fits
from .upscale import restore_to_original
from .catalog import GaiaLiteCatalog

__all__ = [
    "solve_image",
    "solve_fits",
    "restore_to_original",
    "GaiaLiteCatalog",
]