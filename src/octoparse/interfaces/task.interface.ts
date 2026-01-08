export interface OctoparseTask {
  taskId: string;
  taskName: string;
  status: number;
  createTime: string;
  lastRunTime: string;
  taskGroupId?: string;
}

export interface OctoparseTaskGroup {
  taskGroupId: string;
  taskGroupName: string;
  createTime?: string;
}

export interface OctoparseTaskGroupResponse {
  data: {
    total: number;
    taskGroups: OctoparseTaskGroup[];
  };
  requestId: string;
}

export interface OctoparseTaskListResponse {
  data: {
    total: number;
    tasks: OctoparseTask[];
  };
  requestId: string;
}
