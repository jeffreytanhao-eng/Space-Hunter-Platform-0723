import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadService } from './upload.service';

/** 专业天文格式扩展名集合 */
const ASTRO_EXTENSIONS = new Set(['fits', 'fit', 'tiff', 'tif', 'cr2', 'nef', 'arw']);

/** 专业天文格式 MIME 集合 */
const ASTRO_MIMES = new Set([
  'image/fits',
  'application/fits',
  'image/tiff',
  'image/x-canon-cr2',
  'image/x-nikon-nef',
  'image/x-sony-arw',
  'image/x-raw',
]);

@ApiTags('上传')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '通用文件上传（普通图片/专业天文格式自动分流）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '上传文件（支持 jpg/png/webp/gif 及 fits/tiff/cr2/nef/arw）',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 最大 100MB（FITS 上限）
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('未提供文件');
    }

    // 根据 Content-Type 和扩展名分流
    const isAstro = this.isAstroFile(file);

    if (isAstro) {
      return this.uploadService.uploadAstroImage(file, userId);
    } else {
      return this.uploadService.uploadImage(file, userId);
    }
  }

  /** 判断是否为专业天文格式文件 */
  private isAstroFile(file: Express.Multer.File): boolean {
    // 扩展名判断
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    if (ASTRO_EXTENSIONS.has(ext)) {
      return true;
    }

    // MIME 判断
    if (ASTRO_MIMES.has(file.mimetype)) {
      return true;
    }

    return false;
  }
}
