import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true })
  sourceTaskId: string;

  @Prop({ type: Object, required: true })
  data: Record<string, any>;

  @Prop({ default: false })
  processed: boolean;
}

export const JobSchema = SchemaFactory.createForClass(Job);
