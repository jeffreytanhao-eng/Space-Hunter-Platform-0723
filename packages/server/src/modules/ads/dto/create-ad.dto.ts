import { IsString, IsBoolean, IsOptional, IsNumber, MaxLength, IsNotEmpty } from 'class-validator';

/** 创建广告 DTO */
export class CreateAdDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  desc: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  img: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  href?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  address?: string;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
