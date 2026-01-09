import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateJobDto {
  @IsString()
  sourceTaskId: string;

  @IsString()
  jobTitle: string;

  @IsString()
  jobDescription: string;

  @IsString()
  @IsOptional()
  jobSalary?: string | null;

  @IsDateString()
  @IsOptional()
  datePosted?: Date | null;

  @IsBoolean()
  @IsOptional()
  processed?: boolean;
}
