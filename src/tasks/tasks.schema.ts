import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, unique: true })
  taskId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  lastOffset: number;

  @Prop({ default: 'idle' })
  status: 'idle' | 'running' | 'completed' | 'error';

  @Prop()
  lastRun?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

export interface TaskLean {
  _id: string;
  taskId: string;
  name: string;
  lastOffset: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
