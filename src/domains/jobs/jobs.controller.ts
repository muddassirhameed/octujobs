import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './jobs.schema';
import { CreateJobDto } from './dto/job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

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

  // Retrieves a single job by its ID
  @Get(':id')
  async getJobById(@Param('id') id: string): Promise<{ data: Job | null }> {
    const job = await this.jobsService.findOne(id);
    return { data: job ?? null };
  }

  // Creates a new job
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createJob(@Body() createJobDto: CreateJobDto): Promise<{ data: Job }> {
    const job = await this.jobsService.create(createJobDto);
    return { data: job };
  }

  // Updates a job by its ID (full update)
  @Put(':id')
  async updateJob(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
  ): Promise<{ data: Job | null }> {
    const job = await this.jobsService.update(id, updateJobDto);
    return { data: job };
  }

  // Partially updates a job by its ID
  @Patch(':id')
  async patchJob(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
  ): Promise<{ data: Job | null }> {
    const job = await this.jobsService.update(id, updateJobDto);
    return { data: job };
  }

  // Deletes a job by its ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteJob(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.jobsService.remove(id);
    return { success };
  }
}
