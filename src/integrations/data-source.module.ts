import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { OctoparseModule } from './octoparse/octoparse.module';
import { MockDataSourceModule } from './mock/mock-data-source.module';
import { DataSourceFactory } from './data-source.factory';

@Module({
  imports: [ConfigModule, OctoparseModule, MockDataSourceModule],
  providers: [DataSourceFactory],
  exports: [DataSourceFactory, MockDataSourceModule],
})
export class DataSourceModule {}
