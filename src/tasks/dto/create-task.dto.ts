import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  taskId: string;

  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  lastOffset?: number;

  @IsString()
  @IsOptional()
  status?: 'idle' | 'running' | 'completed' | 'error';
}
