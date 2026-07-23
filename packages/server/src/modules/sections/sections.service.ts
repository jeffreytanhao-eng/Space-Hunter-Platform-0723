import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from '../../database/entities/section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
  ) {}

  /** 查询所有已审核板块，按 sort_order 排序 */
  async findAll(): Promise<Section[]> {
    return this.sectionRepo.find({
      where: { status: 'approved' },
      order: { sortOrder: 'ASC' },
    });
  }

  /** 查找单个板块 */
  async findById(id: string): Promise<Section> {
    const section = await this.sectionRepo.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException('板块不存在');
    }
    return section;
  }

  /** 用户申请新板块（status=pending，需管理员审核） */
  async requestSection(userId: string, dto: CreateSectionDto): Promise<Section> {
    const section = this.sectionRepo.create({
      name: dto.name,
      description: dto.description || null,
      icon: dto.icon || null,
      createdBy: userId,
      status: 'pending',
    });
    return this.sectionRepo.save(section);
  }

  /** 管理员更新板块 */
  async updateSection(id: string, dto: UpdateSectionDto): Promise<Section> {
    const section = await this.findById(id);
    Object.assign(section, dto);
    return this.sectionRepo.save(section);
  }
}
