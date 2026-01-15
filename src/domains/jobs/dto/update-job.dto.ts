import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  sourceTaskId?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  jobDescription?: string;

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
