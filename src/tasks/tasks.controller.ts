import { Controller, Get, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getAllTasks() {
    return this.tasksService.findAll();
  }

  @Get(':taskId')
  async getTaskById(@Param('taskId') taskId: string) {
    return this.tasksService.findById(taskId);
  }
}
