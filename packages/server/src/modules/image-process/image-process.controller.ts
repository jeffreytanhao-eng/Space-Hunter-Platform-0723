import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ImageProcessService } from './image-process.service';

/**
 * 双通道图像增强测试接口（无需登录，处理历史全局共享）
 * 通道 A：保真增强（astropy：去背景 + 宇宙线 + ZScale/Asinh 拉伸）
 * 通道 B：AI 渲染（占位实现，未来对接 SD/LoRA）
 */
@ApiTags('图像增强测试')
@Controller('image-process')
export class ImageProcessController {
  constructor(private readonly processService: ImageProcessService) {}

  /** 上传并处理图片（双通道同时执行） */
  @Post('process')
  @ApiOperation({ summary: '上传图片并执行双通道增强' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        sessionId: { type: 'string', description: '匿名会话标识' },
        stretch: { type: 'string', description: '拉伸类型 asinh/log/sqrt/linear' },
        zscaleContrast: { type: 'number', description: 'ZScale 对比度 0.05~0.5' },
        asinhA: { type: 'number', description: 'AsinhStretch a 参数 0.001~1.0' },
        boxSize: { type: 'number', description: 'Background2D 网格大小' },
        enableCosmics: { type: 'string', description: '是否启用宇宙线去除 1/0' },
        cosmicsSigclip: { type: 'number', description: '宇宙线检测显著性阈值' },
        cosmicsObjlim: { type: 'number', description: '宇宙线/天体分离阈值' },
        styleA: { type: 'string', description: '通道A风格: classic(经典天文) / smart(智能增强)' },
        beta: { type: 'number', description: '通道A经典模式 asinh 强度' },
        residualRef: { type: 'number', description: '通道A经典模式残差参考值' },
        style: { type: 'string', description: '通道B风格: deepspace/milkyway/nebula/galaxy' },
        intensity: { type: 'number', description: '通道B艺术强度 0-1' },
        mode: { type: 'string', description: '执行模式: A(仅通道A) / B(仅通道B) / both(双通道)' },
      },
      required: ['file', 'sessionId'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async process(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId?: string,
    @Body('stretch') stretch?: string,
    @Body('zscaleContrast') zscaleContrast?: string,
    @Body('asinhA') asinhA?: string,
    @Body('boxSize') boxSize?: string,
    @Body('enableCosmics') enableCosmics?: string,
    @Body('cosmicsSigclip') cosmicsSigclip?: string,
    @Body('cosmicsObjlim') cosmicsObjlim?: string,
    @Body('styleA') styleA?: string,
    @Body('beta') beta?: string,
    @Body('residualRef') residualRef?: string,
    @Body('style') style?: string,
    @Body('intensity') intensity?: string,
    @Body('mode') mode?: string,
  ) {
    if (!file) throw new BadRequestException('未提供文件');

    const channelAParams = {
      style: (styleA as 'classic' | 'smart') || undefined,
      beta: beta ? parseFloat(beta) : undefined,
      residualRef: residualRef ? parseFloat(residualRef) : undefined,
      stretch: stretch || undefined,
      zscaleContrast: zscaleContrast ? parseFloat(zscaleContrast) : undefined,
      asinhA: asinhA ? parseFloat(asinhA) : undefined,
      boxSize: boxSize ? parseInt(boxSize, 10) : undefined,
      enableCosmics: enableCosmics !== undefined ? enableCosmics === '1' : undefined,
      cosmicsSigclip: cosmicsSigclip ? parseFloat(cosmicsSigclip) : undefined,
      cosmicsObjlim: cosmicsObjlim ? parseFloat(cosmicsObjlim) : undefined,
    };
    const channelBParams = {
      style: style || 'deepspace',
      intensity: intensity ? parseFloat(intensity) : 0.5,
    };

    const runMode: 'A' | 'B' | 'both' = mode === 'A' || mode === 'B' ? mode : 'both';

    const job = await this.processService.processImage(
      file,
      sessionId || 'shared',
      channelAParams,
      channelBParams,
      runMode,
    );
    return { job };
  }

  /** 查询任务状态 */
  @Get('jobs/:id')
  @ApiOperation({ summary: '查询处理任务状态' })
  async getJob(@Param('id') id: string) {
    const job = await this.processService.getJob(id);
    return { job };
  }

  /** 获取历史记录（全局共享，无需 sessionId） */
  @Get('history')
  @ApiOperation({ summary: '获取处理历史' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async getHistory(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.processService.getHistory(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
    return result;
  }

  /** 删除历史记录 */
  @Delete(':id')
  @ApiOperation({ summary: '删除处理记录及对应文件' })
  @ApiParam({ name: 'id', description: '任务ID' })
  async deleteJob(@Param('id') id: string) {
    await this.processService.deleteJob(id);
    return { success: true, message: '删除成功' };
  }
}
