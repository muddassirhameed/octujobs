import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Returns a hello message from the application
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Returns health check status of the application
  @Get('health')
  getHealth(): { status: string; message: string } {
    return {
      status: 'ok',
      message: this.appService.getHello(),
    };
  }
}
