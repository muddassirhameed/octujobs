import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './tasks.schema';
import { TaskLean } from './interface/lean-task';
import { CreateTaskDto } from './dto/create-task.dto';
import { DataSourceFactory } from '../../integrations/data-source.factory';
import { OctoparseTask } from '../../integrations/octoparse/interfaces/task.interface';
import { MockDataSourceService } from '../../integrations/mock/mock-data-source.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    private readonly dataSourceFactory: DataSourceFactory,
    private readonly mockDataSourceService: MockDataSourceService,
  ) {}

  // Syncs all tasks from data source (Octoparse or Mock) and creates/updates them in the database
  async syncTasksFromOctoparse(): Promise<Task[]> {
    this.logger.log('Syncing tasks from data source...');

    try {
      const dataSource = this.dataSourceFactory.getDataSource();
      const groupsResponse = await dataSource.fetchTaskGroups();
      const groups = groupsResponse.data?.taskGroups || [];

      if (groups.length === 0) {
        this.logger.warn('No task groups found in data source');
        return [];
      }

      const allTasks: OctoparseTask[] = [];

      for (const group of groups) {
        try {
          const tasksResponse = await dataSource.fetchTasksByGroup(
            group.taskGroupId,
          );
          const tasks = tasksResponse.data?.tasks || [];
          allTasks.push(...tasks);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to fetch tasks for group ${group.taskGroupId}: ${errorMessage}`,
          );
        }
      }

      const syncedTasks: Task[] = [];

      // For mock data source, use all mock task IDs if no tasks found
      if (allTasks.length === 0) {
        const mockTaskIds = this.mockDataSourceService.getMockTaskIds();
        const taskNames = [
          'Frontend Jobs Scraping',
          'Backend Jobs Scraping',
          'Design Jobs Scraping',
        ];
        mockTaskIds.forEach((taskId, index) => {
          allTasks.push({
            taskId,
            taskName: taskNames[index] || 'Mock Job Scraping Task',
            status: 1,
            createTime: new Date().toISOString(),
            lastRunTime: new Date().toISOString(),
          });
        });
      }

      for (const octoparseTask of allTasks) {
        try {
          const task = await this.createOrUpdate({
            taskId: octoparseTask.taskId,
            name: octoparseTask.taskName,
            status: 'idle',
          });
          syncedTasks.push(task);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to sync task ${octoparseTask.taskId}: ${errorMessage}`,
          );
        }
      }

      this.logger.log(`Synced ${syncedTasks.length} tasks from data source`);
      return syncedTasks;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to sync tasks from data source: ${errorMessage}`,
      );
      throw error;
    }
  }

  // Retrieves all active tasks with status 'idle' or 'running'
  async getActiveTasks(): Promise<TaskLean[]> {
    const result = await this.taskModel
      .find({
        status: { $in: ['idle', 'running'] },
      })
      .sort({ createdAt: -1 })
      .lean();
    return result as unknown as TaskLean[];
  }

  // Creates a new task or updates an existing one based on taskId
  async createOrUpdate(taskDto: CreateTaskDto): Promise<Task> {
    const updateData: Partial<Task> = {
      name: taskDto.name,
      status: taskDto.status || 'idle',
      lastRun: new Date(),
    };

    if (taskDto.lastOffset !== undefined) {
      updateData.lastOffset = taskDto.lastOffset;
    }

    return this.taskModel.findOneAndUpdate(
      { taskId: taskDto.taskId },
      updateData,
      { new: true, upsert: true },
    );
  }

  // Retrieves all tasks from the database sorted by creation date
  async findAll(): Promise<TaskLean[]> {
    const result = await this.taskModel.find().sort({ createdAt: -1 }).lean();
    return result as unknown as TaskLean[];
  }

  // Finds a task by its taskId
  async findById(taskId: string): Promise<TaskLean | null> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      return null;
    }
    const result = await this.taskModel
      .findOne({ taskId: taskId.trim() })
      .lean();
    return (result as unknown as TaskLean | null) ?? null;
  }

  // Updates the status of a task and sets the lastRun timestamp
  async updateStatus(
    taskId: string,
    status: 'idle' | 'running' | 'completed' | 'error',
  ): Promise<Task | null> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      return null;
    }
    return this.taskModel.findOneAndUpdate(
      { taskId: taskId.trim() },
      { status, lastRun: new Date() },
      { new: true },
    );
  }

  // Updates the lastOffset for pagination tracking and sets the lastRun timestamp
  async updateOffset(taskId: string, newOffset: number): Promise<Task | null> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      return null;
    }
    const safeOffset = Math.max(0, Math.floor(newOffset));
    return this.taskModel.findOneAndUpdate(
      { taskId: taskId.trim() },
      { lastOffset: safeOffset, lastRun: new Date() },
      { new: true },
    );
  }

  // Resets the task offset to 0 and sets status to 'idle'
  async resetOffset(taskId: string): Promise<Task | null> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      return null;
    }
    return this.taskModel.findOneAndUpdate(
      { taskId: taskId.trim() },
      { lastOffset: 0, status: 'idle' },
      { new: true },
    );
  }
}
