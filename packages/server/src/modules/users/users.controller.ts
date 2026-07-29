import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('用户')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户资料' })
  @ApiResponse({ status: 200, description: '返回当前用户完整资料' })
  @ApiResponse({ status: 401, description: '未认证' })
  async getMe(@CurrentUser() user: any) {
    const profile = await this.usersService.findById(user.id);
    if (!profile) {
      throw new NotFoundException('用户不存在');
    }
    return profile;
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新个人资料' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未认证' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Put('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置/修改密码' })
  @ApiResponse({ status: 200, description: '密码设置成功' })
  @ApiResponse({ status: 400, description: '旧密码错误或密码格式不符' })
  @ApiResponse({ status: 401, description: '未认证' })
  async updatePassword(
    @CurrentUser() user: any,
    @Body() dto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(user.id, dto.newPassword, dto.oldPassword);
    return { message: '密码设置成功' };
  }

  @Put('me/privacy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新隐私设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未认证' })
  async updatePrivacy(
    @CurrentUser() user: any,
    @Body() dto: UpdatePrivacyDto,
  ) {
    return this.usersService.updatePrivacy(user.id, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传头像' })
  @ApiResponse({ status: 200, description: '上传成功' })
  @ApiResponse({ status: 401, description: '未认证' })
  async uploadAvatar(@CurrentUser() user: any) {
    // TODO: 接入文件上传服务，更新用户头像 URL
    return { message: '头像上传功能待实现' };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取其他用户公开资料' })
  @ApiResponse({ status: 200, description: '返回公开资料' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getPublicProfile(
    @Param('id') id: string,
    @CurrentUser() viewer?: any,
  ) {
    const viewerId = viewer?.id;
    return this.usersService.getPublicProfile(id, viewerId);
  }
}
