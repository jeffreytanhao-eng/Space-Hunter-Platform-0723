import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ad } from './ad.entity';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

/** 首页广告最大展示数量 */
export const MAX_ADS = 5;

/** 默认广告种子数据 */
const DEFAULT_ADS: Partial<Ad>[] = [
  {
    title: '青海冷湖暗夜星空保护区',
    desc: '东方天文圣地 · 光污染等级1级',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Qinghai%20Lenghu%20desert%20stargazing%20observatory%20at%20night%2C%20Milky%20Way%20arch%20over%20Gobi%20desert%20yardang%20landform%2C%20dark%20sky%20reserve%2C%20deep%20blue%20and%20cyan%20tones%2C%20cinematic%20landscape%2C%20no%20text&image_size=portrait_4_3',
    address: '青海省海西州茫崖市冷湖镇',
    lng: 93.82,
    lat: 38.61,
    active: true,
    sortOrder: 1,
  },
  {
    title: '星达 EQ6R Pro 赤道仪',
    desc: '深空摄影旗舰之选 · 承重 20kg',
    href: '#',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20astronomical%20reflector%20telescope%20on%20mountain%20observatory%20under%20Milky%20Way%2C%20deep%20blue%20cyan%20neon%20glow%2C%20futuristic%20tech%20product%20advertisement%2C%20no%20text&image_size=portrait_4_3',
    active: true,
    sortOrder: 2,
  },
  {
    title: '西藏阿里暗夜公园',
    desc: '北半球最佳观星地 · 海拔5100m',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tibet%20Ngari%20dark%20sky%20park%20stargazing%20observatory%20at%20high%20altitude%20plateau%2C%20brilliant%20Milky%20Way%20over%20Himalaya%20mountains%2C%20ultra%20clear%20night%20sky%2C%20cyan%20and%20purple%20tones%2C%20cinematic%2C%20no%20text&image_size=portrait_4_3',
    address: '西藏自治区阿里地区噶尔县',
    lng: 80.08,
    lat: 32.5,
    active: true,
    sortOrder: 3,
  },
];

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    @InjectRepository(Ad)
    private readonly adRepo: Repository<Ad>,
  ) {}

  /** 应用启动时种子默认广告（如果表为空） */
  async seedDefaults(): Promise<void> {
    const count = await this.adRepo.count();
    if (count > 0) return;

    this.logger.log('广告表为空，正在种子默认广告数据...');
    for (const data of DEFAULT_ADS) {
      await this.adRepo.save(this.adRepo.create(data));
    }
    this.logger.log(`已种子 ${DEFAULT_ADS.length} 条默认广告`);
  }

  /** 获取启用的广告（公开，首页用，最多 MAX_ADS 条） */
  async getActiveAds(): Promise<Ad[]> {
    return this.adRepo
      .createQueryBuilder('ad')
      .where('ad.active = :active', { active: true })
      .orderBy('ad.sortOrder', 'ASC')
      .limit(MAX_ADS)
      .getMany();
  }

  /** 获取全部广告（管理后台用） */
  async getAllAds(): Promise<Ad[]> {
    return this.adRepo
      .createQueryBuilder('ad')
      .orderBy('ad.sortOrder', 'ASC')
      .addOrderBy('ad.createdAt', 'DESC')
      .getMany();
  }

  /** 创建广告 */
  async create(dto: CreateAdDto): Promise<Ad> {
    const maxSort = await this.adRepo
      .createQueryBuilder('ad')
      .select('MAX(ad.sortOrder)', 'max')
      .getRawOne();
    const nextSort = (maxSort?.max || 0) + 1;

    const ad = this.adRepo.create({
      ...dto,
      active: dto.active ?? true,
      sortOrder: nextSort,
    });
    return this.adRepo.save(ad);
  }

  /** 更新广告 */
  async update(id: string, dto: UpdateAdDto): Promise<Ad> {
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) {
      throw new Error('广告不存在');
    }
    Object.assign(ad, dto);
    return this.adRepo.save(ad);
  }

  /** 删除广告 */
  async delete(id: string): Promise<void> {
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) {
      throw new Error('广告不存在');
    }
    await this.adRepo.remove(ad);
  }

  /** 重置为默认广告（清除全部后重新种子） */
  async reset(): Promise<void> {
    await this.adRepo.clear();
    for (const data of DEFAULT_ADS) {
      await this.adRepo.save(this.adRepo.create(data));
    }
    this.logger.log('广告已重置为默认数据');
  }
}
