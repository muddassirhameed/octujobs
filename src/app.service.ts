import { Injectable } from '@nestjs/common';
import type { AppConfig } from './config/interface/app-config.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(@Inject('APP_CONFIG') private readonly config: AppConfig) {}

  // Returns a formatted hello message with app name and environment
  getHello(): string {
    return `${this.config.appName} is running in ${this.config.environment} mode`;
  }
}
