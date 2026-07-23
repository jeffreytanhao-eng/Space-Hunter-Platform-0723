import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// 自定义验证管道，用于手动验证 DTO
@Injectable()
export class CustomValidationPipe implements PipeTransform<unknown> {
  async transform(value: unknown, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object as object);
    if (errors.length > 0) {
      const messages = errors
        .map((err) => Object.values(err.constraints || {}).join('; '))
        .join('; ');
      throw new BadRequestException(messages);
    }
    return value;
  }

  private toValidate(metatype: new (...args: any[]) => any): boolean {
    const types: (new (...args: any[]) => any)[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
