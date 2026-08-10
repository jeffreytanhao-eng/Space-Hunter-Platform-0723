import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { QueryFavoritesDto } from './dto/query-favorites.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('收藏')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: '收藏（幂等）' })
  async favorite(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFavoriteDto,
  ) {
    return this.favoritesService.favorite(userId, dto);
  }

  @Delete(':targetType/:targetId')
  @ApiOperation({ summary: '取消收藏（幂等）' })
  @ApiParam({ name: 'targetType', description: 'post/gallery' })
  @ApiParam({ name: 'targetId', description: '收藏对象 ID' })
  async unfavorite(
    @CurrentUser('id') userId: string,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.favoritesService.unfavorite(userId, targetType, targetId);
  }

  @Get()
  @ApiOperation({ summary: '我的收藏列表（分页）' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryFavoritesDto,
  ) {
    return this.favoritesService.findAll(userId, query);
  }
}
