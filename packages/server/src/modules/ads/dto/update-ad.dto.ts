import { PartialType } from '@nestjs/swagger';
import { CreateAdDto } from './create-ad.dto';

/** 更新广告 DTO（所有字段可选） */
export class UpdateAdDto extends PartialType(CreateAdDto) {}
