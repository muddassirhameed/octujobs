import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JobsService } from '../jobs/jobs.service';
import { Task, TaskLean } from './tasks.schema';
import { Job } from '../jobs/jobs.schema';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly jobsService: JobsService,
  ) {}

  // Retrieves all tasks or only active tasks based on query parameter
  @Get()
  async getTasks(@Query('status') status?: string): Promise<TaskLean[]> {
    if (status === 'active') {
      const tasks = await this.tasksService.getActiveTasks();
      return tasks;
    }
    const tasks = await this.tasksService.findAll();
    return tasks;
  }

  // Manually triggers task synchronization from Octoparse API
  @Post('sync')
  async syncTasks(): Promise<Task[]> {
    const tasks = await this.tasksService.syncTasksFromOctoparse();
    return tasks;
  }

  // Retrieves a specific task by its taskId
  @Get(':taskId')
  async getTaskById(@Param('taskId') taskId: string): Promise<TaskLean | null> {
    const task = await this.tasksService.findById(taskId);
    return task;
  }

  // Retrieves all jobs associated with a specific task
  @Get(':taskId/jobs')
  async getJobsByTask(@Param('taskId') taskId: string): Promise<{
    data: Job[];
    count: number;
  }> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      return { data: [], count: 0 };
    }

    const [data, count] = await Promise.all([
      this.jobsService.findByTask(taskId.trim()),
      this.jobsService.countByTask(taskId.trim()),
    ]);

    return {
      data: data as unknown as Job[],
      count,
    };
  }

  // Resets the task offset and status via API endpoint
  @Patch(':taskId/reset')
  async resetTask(@Param('taskId') taskId: string): Promise<Task | null> {
    const task = await this.tasksService.resetOffset(taskId);
    return task;
  }
}
