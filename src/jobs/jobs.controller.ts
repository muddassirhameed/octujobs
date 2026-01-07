import { Controller, Get, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './jobs.schema';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async getJobs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<Job[]> {
    return this.jobsService.findAll(Number(limit), Number(page));
  }

  @Get('by-task')
  async getJobsByTask(@Query('taskId') taskId: string): Promise<Job[]> {
    return this.jobsService.findByTask(taskId);
  }
}
