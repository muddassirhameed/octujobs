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
