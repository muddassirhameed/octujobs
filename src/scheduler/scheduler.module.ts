import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { OctoparseModule } from '../octoparse/octoparse.module';
import { JobsModule } from '../jobs/jobs.module';
import { TasksModule } from '../tasks/tasks.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [OctoparseModule, JobsModule, TasksModule, ConfigModule],
  providers: [SchedulerService],
  controllers: [SchedulerController],
  exports: [SchedulerService],
})
export class SchedulerModule {}
