import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Job, JobDocument } from './jobs.schema';
import { CreateJobDto, NormalizedJobData } from './dto/job.dto';
import { OctoparseDataRow } from '../octoparse/interfaces/data.interface';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
  ) {}

  // Normalizes raw job data from Octoparse into standard job fields (title, description, salary, date)
  private normalizeJobData(rawData: OctoparseDataRow): NormalizedJobData {
    const titleFields = [
      'title',
      'jobTitle',
      'job_title',
      'job-title',
      'job_name',
      'jobName',
      'name',
      'position',
      'jobPosition',
      'job_position',
      'job-position',
      'heading',
      'jobHeading',
      'job_heading',
      'positionTitle',
      'position_title',
      'role',
      'jobRole',
      'job_role',
    ];

    const descriptionFields = [
      'description',
      'jobDescription',
      'job_description',
      'job-description',
      'desc',
      'jobDesc',
      'job_desc',
      'details',
      'jobDetails',
      'job_details',
      'job-details',
      'content',
      'jobContent',
      'job_content',
      'body',
      'jobBody',
      'job_body',
      'summary',
      'jobSummary',
      'job_summary',
      'overview',
      'jobOverview',
      'job_overview',
      'requirements',
      'jobRequirements',
      'job_requirements',
      'text',
      'jobText',
      'job_text',
    ];

    const salaryFields = [
      'salary',
      'jobSalary',
      'job_salary',
      'job-salary',
      'amount',
      'jobAmount',
      'job_amount',
      'price',
      'jobPrice',
      'job_price',
      'wage',
      'jobWage',
      'job_wage',
      'pay',
      'jobPay',
      'job_pay',
      'compensation',
      'jobCompensation',
      'job_compensation',
      'rate',
      'jobRate',
      'job_rate',
      'payment',
      'jobPayment',
      'job_payment',
      'income',
      'jobIncome',
      'job_income',
      'remuneration',
      'jobRemuneration',
      'job_remuneration',
    ];

    const dateFields = [
      'postDate',
      'post_date',
      'post-date',
      'postedDate',
      'posted_date',
      'posted-date',
      'date',
      'jobDate',
      'job_date',
      'job-date',
      'createdDate',
      'created_date',
      'created-date',
      'publishedDate',
      'published_date',
      'published-date',
      'timestamp',
      'jobTimestamp',
      'job_timestamp',
      'postTime',
      'post_time',
      'post-time',
      'postedTime',
      'posted_time',
      'posted-time',
      'createdAt',
      'created_at',
      'created-at',
      'publishedAt',
      'published_at',
      'published-at',
      'datePosted',
      'date_posted',
      'date-posted',
      'listingDate',
      'listing_date',
      'listing-date',
    ];

    const findValue = (keys: string[]): string | null => {
      for (const key of keys) {
        const value = rawData[key];
        if (
          value !== null &&
          value !== undefined &&
          value !== '' &&
          (typeof value === 'string' || typeof value === 'number')
        ) {
          return String(value).trim();
        }
      }

      const rawDataKeys = Object.keys(rawData);
      for (const key of keys) {
        const foundKey = rawDataKeys.find(
          (rk) => rk.toLowerCase() === key.toLowerCase(),
        );
        if (foundKey) {
          const value = rawData[foundKey];
          if (
            value !== null &&
            value !== undefined &&
            value !== '' &&
            (typeof value === 'string' || typeof value === 'number')
          ) {
            return String(value).trim();
          }
        }
      }

      return null;
    };

    const jobTitle = findValue(titleFields) || 'Untitled Job';
    const jobDescription =
      findValue(descriptionFields) || 'No description available';
    const jobSalary = findValue(salaryFields);
    const datePostedStr = findValue(dateFields);
    let datePosted: Date | null = null;
    if (datePostedStr) {
      const parsedDate = new Date(datePostedStr);
      if (!Number.isNaN(parsedDate.getTime())) {
        datePosted = parsedDate;
      } else {
        const timestamp = Number.parseFloat(datePostedStr);
        if (!Number.isNaN(timestamp) && Number.isFinite(timestamp)) {
          const dateMs =
            timestamp < 946684800000 ? timestamp * 1000 : timestamp;
          const dateFromTimestamp = new Date(dateMs);
          if (!Number.isNaN(dateFromTimestamp.getTime())) {
            datePosted = dateFromTimestamp;
          }
        }
      }
    }

    return {
      jobTitle,
      jobDescription,
      jobSalary,
      datePosted,
    };
  }

  // Creates a single job in the database
  async create(job: CreateJobDto): Promise<Job> {
    return this.jobModel.create(job);
  }

  // Bulk creates jobs from raw data rows, normalizes data, and prevents duplicates
  async bulkCreate(
    taskId: string,
    rows: OctoparseDataRow[],
  ): Promise<{ created: number; skipped: number }> {
    if (!rows.length) {
      return { created: 0, skipped: 0 };
    }

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        const normalized = this.normalizeJobData(row);

        const existing = await this.jobModel.findOne({
          sourceTaskId: taskId,
          jobTitle: normalized.jobTitle,
        });

        if (existing) {
          skipped++;
          continue;
        }

        await this.jobModel.create({
          sourceTaskId: taskId,
          ...normalized,
          rawData: row,
          processed: false,
        });

        created++;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.warn(
          `Failed to create job from row: ${JSON.stringify(row).substring(0, 100)}... Error: ${errorMessage}`,
          errorStack,
        );
        skipped++;
      }
    }

    this.logger.log(
      `Bulk create completed: ${created} created, ${skipped} skipped for task ${taskId}`,
    );

    return { created, skipped };
  }

  // Retrieves paginated list of all jobs sorted by creation date
  async findAll(limit = 20, page = 1): Promise<Job[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const safePage = Math.max(1, Math.floor(page));
    const result = await this.jobModel
      .find()
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();
    return result as unknown as Job[];
  }

  // Retrieves all jobs associated with a specific task
  async findByTask(taskId: string): Promise<Job[]> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      return [];
    }
    const result = await this.jobModel
      .find({ sourceTaskId: taskId.trim() })
      .sort({ createdAt: -1 })
      .lean();
    return result as unknown as Job[];
  }

  // Returns the total count of all jobs in the database
  async count(): Promise<number> {
    return this.jobModel.countDocuments();
  }

  // Returns the count of jobs for a specific task
  async countByTask(taskId: string): Promise<number> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      return 0;
    }
    return this.jobModel.countDocuments({ sourceTaskId: taskId.trim() });
  }
}
