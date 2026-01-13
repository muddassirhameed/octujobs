import { Module, Global } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import { AppConfig } from './interface/app-config.interface';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [
    {
      provide: 'APP_CONFIG',
      useFactory: (configService: ConfigService): AppConfig => {
        // Try multiple possible environment variable names (Railway might use different names)
        const mongodbUri = (
          configService.get<string>('MONGODB_URI') ||
          configService.get<string>('MONGO_URI') ||
          configService.get<string>('MONGODB_URL') ||
          configService.get<string>('MONGO_URL') ||
          configService.get<string>('DATABASE_URL') ||
          ''
        ).trim();

        // Validate MongoDB URI
        if (!mongodbUri) {
          throw new Error(
            'MongoDB connection string is required. Please set one of these environment variables: MONGODB_URI, MONGO_URI, MONGODB_URL, MONGO_URL, or DATABASE_URL',
          );
        }

        if (
          !mongodbUri.startsWith('mongodb://') &&
          !mongodbUri.startsWith('mongodb+srv://')
        ) {
          throw new Error(
            `Invalid MongoDB connection string format. Must start with "mongodb://" or "mongodb+srv://". Got: "${mongodbUri.substring(0, 50)}${mongodbUri.length > 50 ? '...' : ''}"`,
          );
        }

        return {
          appName: configService.get<string>('APP_NAME', 'web-jobs-scraper'),
          environment: configService.get<'development' | 'production'>(
            'APP_ENV',
            'development',
          ),
          port: Number(configService.get<number>('APP_PORT', 5000)),
          mongodbUri,
          octoparseUsername: configService.get<string>(
            'OCTOPARSE_USERNAME',
            '',
          ),
          octoparsePassword: configService.get<string>(
            'OCTOPARSE_PASSWORD',
            '',
          ),
          scrapeIntervalSeconds: Number(
            configService.get<number>('SCRAPE_INTERVAL_SECONDS', 3600),
          ),
          logLevel: configService.get<'debug' | 'info' | 'warn' | 'error'>(
            'LOG_LEVEL',
            'debug',
          ),
        };
      },
      inject: [ConfigService],
    },
  ],
  exports: ['APP_CONFIG', NestConfigModule],
})
export class ConfigModule {}
