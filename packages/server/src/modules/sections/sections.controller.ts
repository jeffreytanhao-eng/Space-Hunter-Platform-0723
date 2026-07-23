import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('板块')
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @ApiOperation({ summary: '获取板块列表（仅已审核）' })
  async findAll() {
    return this.sectionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取板块详情' })
  @ApiParam({ name: 'id', description: '板块 ID' })
  async findById(@Param('id') id: string) {
    return this.sectionsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户申请新板块' })
  async requestSection(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionsService.requestSection(userId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '管理员更新板块' })
  @ApiParam({ name: 'id', description: '板块 ID' })
  async updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser('role') role: string,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('仅管理员可更新板块');
    }
    return this.sectionsService.updateSection(id, dto);
  }
}
