import { IsBoolean, IsObject, IsString } from 'class-validator';

export class CreateJobDto {
  @IsString()
  sourceTaskId: string;

  @IsObject()
  data: Record<string, any>;

  @IsBoolean()
  processed?: boolean;
}
