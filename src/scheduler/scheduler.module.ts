import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { OctoparseModule } from '../integrations/octoparse/octoparse.module';
import { JobsModule } from '../domains/jobs/jobs.module';
import { TasksModule } from '../domains/tasks/tasks.module';
import { ConfigModule } from '../config/config.module';
@Module({
  imports: [OctoparseModule, JobsModule, TasksModule, ConfigModule],
  providers: [SchedulerService],
  controllers: [SchedulerController],
  exports: [SchedulerService],
})
export class SchedulerModule {}
