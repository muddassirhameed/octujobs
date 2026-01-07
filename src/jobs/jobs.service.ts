import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Job, JobDocument } from './jobs.schema';
import { CreateJobDto } from './dto/job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
  ) {}

  async create(job: CreateJobDto): Promise<Job> {
    return this.jobModel.create(job);
  }

  async bulkCreate(taskId: string, rows: Record<string, any>[]): Promise<void> {
    if (!rows.length) return;

    const documents = rows.map((row) => ({
      sourceTaskId: taskId,
      data: row,
    }));

    await this.jobModel.insertMany(documents, { ordered: false });
  }

  async findAll(limit = 20, page = 1): Promise<Job[]> {
    return this.jobModel
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  async findByTask(taskId: string): Promise<Job[]> {
    return this.jobModel.find({ sourceTaskId: taskId }).lean();
  }
}
