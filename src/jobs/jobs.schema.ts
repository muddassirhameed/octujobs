import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, index: true })
  sourceTaskId: string;

  @Prop({ required: true, index: true })
  jobTitle: string;

  @Prop({ required: true, type: String })
  jobDescription: string;

  @Prop({ type: String, default: null })
  jobSalary: string | null;

  @Prop({ type: Date, default: null, index: true })
  datePosted: Date | null;

  @Prop({ type: Object, required: false })
  rawData?: Record<string, unknown>;

  @Prop({ default: false })
  processed: boolean;
}

export const JobSchema = SchemaFactory.createForClass(Job);
JobSchema.index({ sourceTaskId: 1, jobTitle: 1 });
JobSchema.index({ sourceTaskId: 1, createdAt: -1 });
JobSchema.index({ datePosted: -1 });
