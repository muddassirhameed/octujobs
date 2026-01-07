import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './tasks.schema';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
  ) {}

  async createOrUpdate(taskDto: CreateTaskDto): Promise<Task> {
    return this.taskModel.findOneAndUpdate(
      { taskId: taskDto.taskId },
      { ...taskDto, lastRun: new Date() },
      { new: true, upsert: true },
    );
  }

  async findAll(): Promise<Task[]> {
    return this.taskModel.find().sort({ createdAt: -1 }).lean();
  }

  async findById(taskId: string): Promise<Task | null> {
    return this.taskModel.findOne({ taskId }).lean();
  }

  async updateStatus(
    taskId: string,
    status: 'idle' | 'running' | 'completed' | 'error',
  ): Promise<Task | null> {
    return this.taskModel.findOneAndUpdate(
      { taskId },
      { status, lastRun: new Date() },
      { new: true },
    );
  }
}
