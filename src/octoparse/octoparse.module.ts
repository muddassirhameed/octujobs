import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OctoparseService } from './octoparse.service';

@Module({
  imports: [ConfigModule],
  providers: [OctoparseService],
  exports: [OctoparseService],
})
export class OctoparseModule {}
