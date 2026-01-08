import { Module } from '@nestjs/common';
import { OctoparseService } from './octoparse.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [OctoparseService],
  exports: [OctoparseService],
})
export class OctoparseModule {}
