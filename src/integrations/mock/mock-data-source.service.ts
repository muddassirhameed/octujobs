import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IDataSource } from '../data-source.interface';
import { OctoparseDataResponse } from '../octoparse/interfaces/data.interface';
import {
  OctoparseTaskGroupResponse,
  OctoparseTaskListResponse,
} from '../octoparse/interfaces/task.interface';
import { OctoparseDataRow } from '../octoparse/interfaces/data.interface';

@Injectable()
export class MockDataSourceService implements IDataSource {
  private readonly logger = new Logger(MockDataSourceService.name);
  private readonly mockDataDir: string;
  private readonly mockTasks = [
    {
      taskId: 'mock-task-frontend',
      taskName: 'Frontend Jobs Scraping',
      fileName: 'frontend-jobs.json',
    },
    {
      taskId: 'mock-task-backend',
      taskName: 'Backend Jobs Scraping',
      fileName: 'backend-job.json',
    },
    {
      taskId: 'mock-task-design',
      taskName: 'Design Jobs Scraping',
      fileName: 'design-job.json',
    },
  ];
  private readonly MOCK_TASK_GROUP_ID = 'mock-group-001';
  private taskDataCache: Map<string, OctoparseDataRow[]> = new Map();

  constructor() {
    // Path to mock JSON files directory - use process.cwd() for production-ready path resolution
    // Works in both development (src/) and production (dist/) builds
    const projectRoot = process.cwd();

    // Try multiple possible locations in order of preference
    const possibleDirs = [
      // Production build (JSON copied to dist by nest-cli.json)
      path.join(projectRoot, 'dist', 'domains', 'jobs', 'mock'),
      // Development (source file)
      path.join(projectRoot, 'src', 'domains', 'jobs', 'mock'),
      // Fallback: relative to compiled file location (for dist builds)
      path.join(__dirname, '../../domains/jobs/mock'),
      // Fallback: relative to source file location (for dev)
      path.join(__dirname, '../domains/jobs/mock'),
    ];

    // Find the first existing directory
    let foundDir: string | null = null;
    for (const possibleDir of possibleDirs) {
      if (fs.existsSync(possibleDir)) {
        foundDir = possibleDir;
        break;
      }
    }

    // Default to src path if none found (will log warning but continue)
    this.mockDataDir =
      foundDir || path.join(projectRoot, 'src', 'domains', 'jobs', 'mock');

    // Load all task data files
    this.loadAllMockData();
  }

  /**
   * Loads all mock data files for all tasks
   */
  private loadAllMockData(): void {
    this.taskDataCache.clear();

    for (const task of this.mockTasks) {
      const filePath = path.join(this.mockDataDir, task.fileName);
      const jobs = this.loadMockDataFromFile(filePath, task.taskId);
      this.taskDataCache.set(task.taskId, jobs);
    }

    const totalJobs = Array.from(this.taskDataCache.values()).reduce(
      (sum, jobs) => sum + jobs.length,
      0,
    );
    this.logger.log(
      `Loaded ${totalJobs} total mock jobs from ${this.mockTasks.length} files`,
    );
  }

  /**
   * Loads mock data from a specific JSON file
   */
  private loadMockDataFromFile(
    filePath: string,
    taskId: string,
  ): OctoparseDataRow[] {
    try {
      if (!fs.existsSync(filePath)) {
        this.logger.warn(
          `Mock data file not found at ${filePath} for task ${taskId}, using empty data`,
        );
        return [];
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed: unknown = JSON.parse(fileContent);

      if (!Array.isArray(parsed)) {
        this.logger.warn(
          `Mock data in ${filePath} is not an array, using empty data`,
        );
        return [];
      }

      // Safe string conversion helper - prevents object stringification
      const safeString = (value: unknown): string => {
        if (typeof value === 'string') return value;
        if (value === null || value === undefined) return '';
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }
        // Don't stringify objects/arrays - return empty string instead
        return '';
      };

      // Transform mock JSON to match OctoparseDataRow format
      // Handle both old format (Job_Title, Job_location, btn_URL) and new format (title, desc, etc.)
      const jobs = parsed.map((item: unknown): OctoparseDataRow => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const record = item as Record<string, unknown>;

          // Support both old and new field names
          const jobTitle =
            safeString(record.Job_Title) ||
            safeString(record.title) ||
            safeString(record.jobTitle) ||
            '';
          const jobLocation =
            safeString(record.Job_location) ||
            safeString(record.location) ||
            safeString(record.desc) ||
            '';
          const jobUrl =
            safeString(record.btn_URL) ||
            safeString(record.url) ||
            safeString(record.btnURL) ||
            '';

          return {
            Job_Title: jobTitle,
            Job_location: jobLocation,
            btn_URL: jobUrl,
            // Include all original fields
            ...record,
          } as OctoparseDataRow;
        }
        return {
          Job_Title: '',
          Job_location: '',
          btn_URL: '',
        };
      });

      this.logger.log(
        `Loaded ${jobs.length} mock jobs from ${filePath} for task ${taskId}`,
      );
      return jobs;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to load mock data from ${filePath}: ${errorMessage}. Using empty data.`,
      );
      return [];
    }
  }

  /**
   * Returns mock task groups (simulating Octoparse response)
   */
  async fetchTaskGroups(): Promise<OctoparseTaskGroupResponse> {
    this.logger.log('Fetching mock task groups');
    // Use Promise.resolve to satisfy async requirement
    return Promise.resolve({
      data: {
        total: 1,
        taskGroups: [
          {
            taskGroupId: this.MOCK_TASK_GROUP_ID,
            taskGroupName: 'Mock Job Scraping Group',
            createTime: new Date().toISOString(),
          },
        ],
      },
      requestId: `mock-request-${Date.now()}`,
    });
  }

  /**
   * Returns mock tasks for a task group (simulating Octoparse response)
   * Returns 3 tasks: Frontend, Backend, and Design
   */
  async fetchTasksByGroup(
    taskGroupId: string,
  ): Promise<OctoparseTaskListResponse> {
    this.logger.log(`Fetching mock tasks for group: ${taskGroupId}`);
    // Use Promise.resolve to satisfy async requirement
    return Promise.resolve({
      data: {
        total: this.mockTasks.length,
        tasks: this.mockTasks.map((task) => ({
          taskId: task.taskId,
          taskName: task.taskName,
          status: 1,
          createTime: new Date().toISOString(),
          lastRunTime: new Date().toISOString(),
          taskGroupId: taskGroupId || this.MOCK_TASK_GROUP_ID,
        })),
      },
      requestId: `mock-request-${Date.now()}`,
    });
  }

  /**
   * Returns mock job data with pagination support (simulating Octoparse response)
   * Loads data from the specific JSON file for the given taskId
   */
  async fetchTaskData(
    taskId: string,
    offset = 0,
    size = 100,
  ): Promise<OctoparseDataResponse> {
    this.logger.log(
      `Fetching mock task data for taskId: ${taskId}, offset: ${offset}, size: ${size}`,
    );

    const safeOffset = Math.max(0, Math.floor(offset));
    const safeSize = Math.max(1, Math.min(1000, Math.floor(size)));

    // Find the task configuration
    const task = this.mockTasks.find((t) => t.taskId === taskId);
    if (!task) {
      this.logger.warn(`Task ${taskId} not found, returning empty data`);
      return Promise.resolve({
        data: {
          total: 0,
          rows: [],
        },
        requestId: `mock-request-${Date.now()}`,
      });
    }

    // Reload data in case file was updated
    const filePath = path.join(this.mockDataDir, task.fileName);
    const jobs = this.loadMockDataFromFile(filePath, taskId);
    this.taskDataCache.set(taskId, jobs);

    const total = jobs.length;
    const startIndex = safeOffset;
    const endIndex = Math.min(startIndex + safeSize, total);
    const rows = jobs.slice(startIndex, endIndex);

    this.logger.log(
      `Returning ${rows.length} mock jobs from ${task.fileName} (offset: ${safeOffset}, total: ${total})`,
    );

    // Use Promise.resolve to satisfy async requirement
    return Promise.resolve({
      data: {
        total,
        rows,
      },
      requestId: `mock-request-${Date.now()}`,
    });
  }

  /**
   * Gets all mock task IDs (useful for creating tasks in DB)
   */
  getMockTaskIds(): string[] {
    return this.mockTasks.map((task) => task.taskId);
  }

  /**
   * Gets a specific mock task ID by index (for backward compatibility)
   */
  getMockTaskId(index = 0): string {
    return this.mockTasks[index]?.taskId || this.mockTasks[0].taskId;
  }
}
