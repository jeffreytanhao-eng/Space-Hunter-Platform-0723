import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../../database/entities/event.entity';
import { EventSignup } from '../../database/entities/event-signup.entity';
import { AdminLog } from '../../database/entities/admin-log.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

// 活动模块
@Module({
  imports: [TypeOrmModule.forFeature([Event, EventSignup, AdminLog])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
