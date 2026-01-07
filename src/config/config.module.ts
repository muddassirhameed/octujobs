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
      useFactory: (configService: ConfigService): AppConfig => ({
        appName: configService.get<string>('APP_NAME', 'web-jobs-scraper'),
        environment: configService.get<'development' | 'production'>(
          'APP_ENV',
          'development',
        ),
        port: Number(configService.get<number>('APP_PORT', 5000)),
        mongodbUri: configService.get<string>('MONGODB_URI', ''),
        octoparseUsername: configService.get<string>('OCTOPARSE_USERNAME', ''),
        octoparsePassword: configService.get<string>('OCTOPARSE_PASSWORD', ''),
        scrapeIntervalSeconds: Number(
          configService.get<number>('SCRAPE_INTERVAL_SECONDS', 3600),
        ),
        logLevel: configService.get<'debug' | 'info' | 'warn' | 'error'>(
          'LOG_LEVEL',
          'debug',
        ),
      }),
      inject: [ConfigService],
    },
  ],
  exports: ['APP_CONFIG', NestConfigModule],
})
export class ConfigModule {}
