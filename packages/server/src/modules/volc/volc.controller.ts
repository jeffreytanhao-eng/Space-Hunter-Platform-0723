import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { VolcService } from './volc.service';

/** 画质增强请求体 */
export class EnhanceImageDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  toolVersion?: string;

  @IsOptional()
  @IsNumber()
  multiple?: number;

  @IsOptional()
  @IsNumber()
  targetWidth?: number;

  @IsOptional()
  @IsNumber()
  targetHeight?: number;
}

/** AIGC 大模型超分请求体 */
export class AiUpscaleDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsNumber()
  multiple?: number;
}

/**
 * 火山引擎 MediaKit 测试接口（隐藏，仅管理员）
 * 用于快速测试图像画质增强模型效果
 */
@ApiTags('火山MediaKit测试')
@Controller('volc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VolcController {
  constructor(private readonly volcService: VolcService) {}

  /** 仅管理员可访问 */
  private checkAdmin(role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可访问');
    }
  }

  @Post('upload')
  @ApiOperation({ summary: '上传本地图片到火山，返回 mediakit://file_id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 火山 enhance-image 单图上限 10MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('role') role: string,
  ) {
    this.checkAdmin(role);
    if (!file) {
      throw new BadRequestException('未提供文件');
    }
    const { file_id, upload_url } = await this.volcService.requestUploadUrl();
    await this.volcService.uploadFile(upload_url, file.buffer, file.mimetype);
    // 火山返回的 file_id 本身已含 mediakit:// 前缀，可直接作为 image_url 使用
    return { fileId: file_id };
  }

  @Post('enhance')
  @ApiOperation({ summary: '提交图像画质增强任务' })
  async enhance(
    @Body() dto: EnhanceImageDto,
    @CurrentUser('role') role: string,
  ) {
    this.checkAdmin(role);
    if (!dto.imageUrl) {
      throw new BadRequestException('缺少 imageUrl');
    }
    const result = await this.volcService.enhanceImage({
      imageUrl: dto.imageUrl,
      toolVersion: dto.toolVersion,
      multiple: dto.multiple,
      targetWidth: dto.targetWidth,
      targetHeight: dto.targetHeight,
    });
    return { result };
  }

  @Post('ai-upscale')
  @ApiOperation({ summary: 'veImageX AIGC 大模型超分（最高 30x）' })
  async aiUpscale(
    @Body() dto: AiUpscaleDto,
    @CurrentUser('role') role: string,
  ) {
    this.checkAdmin(role);
    if (!dto.imageUrl) {
      throw new BadRequestException('缺少 imageUrl');
    }
    if (!this.volcService.isImagexConfigured()) {
      throw new BadRequestException('veImageX 尚未配置，请先设置 ServiceId 与 AK/SK');
    }
    const result = await this.volcService.aiUpscale(dto.imageUrl, dto.multiple || 4);
    return { result };
  }

  /**
   * 代理下载增强后的图片（规避浏览器跨域限制）
   * 火山返回的图片 URL 在浏览器直接 fetch 会因 CORS 失败，
   * 通过后端转发即可正常下载。
   */
  @Get('image')
  @ApiOperation({ summary: '代理下载增强后图片（规避 CORS）' })
  async proxyImage(
    @Query('url') url: string,
    @CurrentUser('role') role: string,
    @Res() res: Response,
  ) {
    this.checkAdmin(role);
    if (!url) {
      throw new BadRequestException('缺少 url');
    }
    // 仅允许转发火山图片域名，防止 SSRF
    if (!/^https:\/\/([\w-]+\.)*(volces\.com|volces\.org)/.test(url)) {
      throw new BadRequestException('仅允许转发火山图片地址');
    }
    const buf = await this.volcService.fetchExternalImage(url);
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="enhanced.jpg"`,
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  }
}