import { Injectable, Logger, Inject } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OctoparseService } from '../octoparse/octoparse.service';
import { JobsService } from '../jobs/jobs.service';
import type { AppConfig } from '../config/interface/app-config.interface'; // ✅ import type

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly octoparseService: OctoparseService,
    private readonly jobsService: JobsService,
    @Inject('APP_CONFIG') private readonly config: AppConfig, // ✅ Use AppConfig, NOT ConfigModule
  ) {}

  /**
   * Scheduler interval
   * Runs every SCRAPE_INTERVAL_SECONDS
   */
  @Interval(60000) // placeholder, you can dynamically set interval in constructor if needed
  async handleScrape(): Promise<void> {
    try {
      const intervalMs = this.config.scrapeIntervalSeconds * 1000;
      this.logger.log(`Scheduler triggered, interval set to ${intervalMs}ms`);

      // 1️⃣ Fetch all tasks from Octoparse
      const tasksResponse = await this.octoparseService.fetchTasks();
      const tasks = tasksResponse.data.tasks ?? [];

      if (!tasks.length) {
        this.logger.warn('No tasks found in Octoparse');
        return;
      }

      // 2️⃣ Loop through tasks and fetch data
      for (const task of tasks) {
        const taskData = await this.octoparseService.fetchTaskData(task.taskId);
        const rows = taskData.data.rows ?? [];

        if (!rows.length) {
          this.logger.log(`No data for task: ${task.taskName}`);
          continue;
        }

        // 3️⃣ Save data in MongoDB
        await this.jobsService.bulkCreate(task.taskId, rows);
        this.logger.log(`Saved ${rows.length} rows for task: ${task.taskName}`);
      }

      this.logger.log('Scheduler completed successfully');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Scheduler failed', error.stack);
      } else {
        this.logger.error('Scheduler failed', JSON.stringify(error));
      }
    }
  }
}
