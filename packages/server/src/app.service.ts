import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      message: '太空猎人后端服务运行中',
      timestamp: new Date().toISOString(),
    };
  }
}
