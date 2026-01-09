import { Controller, Post, Get } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import type { SchedulerStatus } from './interface/scheduler-status';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  // Manually triggers the scraping job via API endpoint
  @Post('run')
  async runScrape(): Promise<{ message: string }> {
    await this.schedulerService.triggerScrape();
    return { message: 'Scraping job triggered successfully' };
  }

  // Returns the current scheduler status via API endpoint
  @Get('status')
  getStatus(): SchedulerStatus {
    return this.schedulerService.getStatus();
  }
}
