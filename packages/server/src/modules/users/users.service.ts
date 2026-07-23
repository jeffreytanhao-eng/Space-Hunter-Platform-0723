import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';

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

  /** 按微信 openid 查找用户 */
  async findByWechatOpenid(openid: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { wechatOpenid: openid } });
  }

  /** 创建用户 */
  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  /** 更新个人资料 */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    Object.assign(user, dto);
    return this.userRepository.save(user);
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
