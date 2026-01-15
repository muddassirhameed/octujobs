import { Module } from '@nestjs/common';
import { MockDataSourceService } from './mock-data-source.service';

@Module({
  providers: [MockDataSourceService],
  exports: [MockDataSourceService],
})
export class MockDataSourceModule {}
