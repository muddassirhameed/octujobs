export interface OctoparseTask {
  taskId: string;
  taskName: string;
  status: number;
  createTime: string;
  lastRunTime: string;
}

export interface OctoparseTaskListResponse {
  data: {
    total: number;
    tasks: OctoparseTask[];
  };
  requestId: string;
}
