import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { OctoparseModule } from '../octoparse/octoparse.module';
import { JobsModule } from '../jobs/jobs.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [OctoparseModule, JobsModule, ConfigModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
