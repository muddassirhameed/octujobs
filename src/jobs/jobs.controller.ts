import { Controller, Get, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './jobs.schema';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Retrieves paginated list of jobs with pagination metadata
  @Get()
  async getJobs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ): Promise<{
    data: Job[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, Number.parseInt(limit, 10) || 20),
    );

    const [data, total] = await Promise.all([
      this.jobsService.findAll(limitNum, pageNum),
      this.jobsService.count(),
    ]);

    return {
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
      },
    };
  }

  // Returns the total count of jobs via API endpoint
  @Get('count')
  async getCount(): Promise<{ total: number }> {
    const total = await this.jobsService.count();
    return { total };
  }
}
