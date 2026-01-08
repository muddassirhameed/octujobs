import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OctoparseService } from '../octoparse/octoparse.service';
import { JobsService } from '../jobs/jobs.service';
import { TasksService } from '../tasks/tasks.service';
import { TaskLean } from '../tasks/tasks.schema';
import type { AppConfig } from '../config/interface/app-config.interface';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private isRunning = false;

  constructor(
    private readonly tasksService: TasksService,
    private readonly octoparseService: OctoparseService,
    private readonly jobsService: JobsService,
    @Inject('APP_CONFIG') private readonly config: AppConfig,
  ) {
    this.logger.log(
      `Scheduler initialized (scrape interval config: ${this.config.scrapeIntervalSeconds}s)`,
    );
  }

  // Handles the scheduled hourly scraping job execution
  @Cron(CronExpression.EVERY_HOUR)
  async handleScrape(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Scraping job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.log('=== Starting scheduled scraping job ===');
      this.logger.log('Step 1: Syncing tasks from Octoparse...');
      await this.tasksService.syncTasksFromOctoparse();

      this.logger.log('Step 2: Fetching active tasks...');
      const activeTasks: TaskLean[] = await this.tasksService.getActiveTasks();

      if (activeTasks.length === 0) {
        this.logger.warn('No active tasks found, skipping data fetch');
        return;
      }

      this.logger.log(`Found ${activeTasks.length} active task(s)`);
      for (const task of activeTasks) {
        await this.processTask(task);
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `=== Scraping job completed successfully in ${duration}ms ===`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Scraping job failed: ${errorMessage}`, errorStack);
    } finally {
      this.isRunning = false;
    }
  }

  // Processes a single task by fetching data, normalizing jobs, and updating task status
  private async processTask(task: TaskLean): Promise<void> {
    const taskId = task.taskId?.trim() ?? '';
    const name = task.name?.trim() ?? '';
    const lastOffset = task.lastOffset ?? 0;

    if (!taskId) {
      this.logger.error('Invalid task: taskId is missing or empty');
      return;
    }

    try {
      this.logger.log(`Processing task: ${name} (${taskId})`);
      await this.tasksService.updateStatus(taskId, 'running');

      const batchSize = 100;
      const safeOffset = Math.max(0, Math.floor(lastOffset));

      const dataResponse = await this.octoparseService.fetchTaskData(
        taskId,
        safeOffset,
        batchSize,
      );

      const rows = dataResponse.data?.rows ?? [];
      const total = dataResponse.data?.total ?? 0;

      if (rows.length === 0) {
        this.logger.log(`No new data for task: ${name}`);
        await this.tasksService.updateStatus(taskId, 'idle');
        return;
      }

      this.logger.log(
        `Fetched ${rows.length} rows (offset: ${safeOffset}, total: ${total})`,
      );

      const result = await this.jobsService.bulkCreate(taskId, rows);
      this.logger.log(
        `Saved ${result.created} jobs, skipped ${result.skipped} duplicates for task: ${name}`,
      );

      const newOffset = safeOffset + rows.length;
      await this.tasksService.updateOffset(taskId, newOffset);

      if (newOffset >= total) {
        this.logger.log(`All data fetched for task: ${name}`);
        await this.tasksService.updateStatus(taskId, 'completed');
      } else {
        await this.tasksService.updateStatus(taskId, 'idle');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to process task ${name} (${taskId}): ${errorMessage}`,
        errorStack,
      );
      await this.tasksService.updateStatus(taskId, 'error');
    }
  }

  // Manually triggers the scraping job
  async triggerScrape(): Promise<void> {
    this.logger.log('Manual scrape triggered');
    await this.handleScrape();
  }

  // Returns the current status of the scheduler
  getStatus(): SchedulerStatus {
    return {
      isRunning: this.isRunning,
      message: this.isRunning
        ? 'Scraping job is currently running'
        : 'Scheduler is idle',
    };
  }
}

export interface SchedulerStatus {
  isRunning: boolean;
  lastRun?: Date;
  message: string;
}
