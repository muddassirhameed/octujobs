import { Module, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import type { AppConfig } from './config/interface/app-config.interface';
import { OctoparseModule } from './integrations/octoparse/octoparse.module';
import { TasksModule } from './domains/tasks/tasks.module';
import { JobsModule } from './domains/jobs/jobs.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: ['APP_CONFIG'],
      useFactory: (config: AppConfig) => {
        // Ensure URI is trimmed and valid
        const uri = config.mongodbUri.trim();

        if (!uri) {
          throw new Error(
            'MongoDB URI is empty. Please check MONGODB_URI environment variable.',
          );
        }

        Logger.log(`Connecting to MongoDB...`, 'Mongoose');

        return {
          uri,
          autoIndex: true,
          connectionFactory: (connection: Connection): Connection => {
            Logger.log(
              `MongoDB connected successfully → ${connection.name}`,
              'Mongoose',
            );
            return connection;
          },
        };
      },
    }),

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
