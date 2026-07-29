import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { auditFields } from '../../common/utils/sensitive-words';

// 用户服务
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** 根据 ID 查找用户 */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /** 按手机号查找用户 */
  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  /** 按用户名查找用户（管理员密码登录） */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /** 按昵称查找用户（注册时确保昵称唯一） */
  async findByNickname(nickname: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { nickname } });
  }

  /** 按微信 openid 查找用户 */
  async findByWechatOpenid(openid: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { wechatOpenid: openid } });
  }

  /** 创建用户 */
  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  /** 更新个人资料（含敏感词审核 + username 唯一性检查） */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 敏感词审核
    auditFields({
      昵称: dto.nickname,
      用户名: dto.username,
      简介: dto.bio,
      设备信息: dto.equipment,
    });
    if (dto.interests) {
      dto.interests.forEach((tag) => auditFields({ 兴趣标签: tag }));
    }

    // username 唯一性检查
    if (dto.username && dto.username !== user.username) {
      const existing = await this.findByUsername(dto.username);
      if (existing && existing.id !== userId) {
        throw new BadRequestException('该用户名已被占用');
      }
    }

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  /** 设置/修改密码（手机号注册用户首次设置密码，或修改已有密码） */
  async updatePassword(userId: string, newPassword: string, oldPassword?: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 如果用户已有密码，需要验证旧密码
    if (user.password) {
      if (!oldPassword) {
        throw new BadRequestException('请输入旧密码');
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('旧密码错误');
      }
    }

    // 设置新密码
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }

  /** 更新隐私设置 */
  async updatePrivacy(userId: string, dto: UpdatePrivacyDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    user.privacyProfile = dto.profileVisibility;
    user.privacyDynamic = dto.dynamicVisibility;
    return this.userRepository.save(user);
  }

  /** 获取公开资料（根据隐私设置过滤字段） */
  async getPublicProfile(userId: string, viewerId?: string): Promise<Partial<User>> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 公开资料基础字段
    const publicFields: Partial<User> = {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      interests: user.interests,
      equipment: user.equipment,
      createdAt: user.createdAt,
    };

    // 根据隐私设置决定是否返回更多信息
    if (user.privacyProfile === 'private') {
      // 完全私密，只返回基础信息
      return { id: user.id, nickname: user.nickname, avatar: user.avatar };
    }

    if (user.privacyProfile === 'followers' && viewerId) {
      // TODO: 检查 viewerId 是否是 userId 的粉丝，如果是则返回完整资料
      // 当前阶段返回基础公开资料
    }

    return publicFields;
  }
}
