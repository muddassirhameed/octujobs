import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from './config/config.module';
import type { AppConfig } from './config/interface/app-config.interface';
import { OctoparseModule } from './octoparse/octoparse.module';
import { TasksModule } from './tasks/tasks.module';
import { JobsModule } from './jobs/jobs.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    // Scheduler support
    ScheduleModule.forRoot(),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: ['APP_CONFIG'],
      useFactory: (config: AppConfig) => ({
        uri: config.mongodbUri,
        autoIndex: true,
      }),
    }),

    // App modules
    ConfigModule,
    OctoparseModule,
    TasksModule,
    JobsModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
