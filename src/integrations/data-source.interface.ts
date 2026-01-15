import { OctoparseDataResponse } from './octoparse/interfaces/data.interface';
import {
  OctoparseTaskGroupResponse,
  OctoparseTaskListResponse,
} from './octoparse/interfaces/task.interface';

/**
 * Data Source Interface
 * Abstracts the data fetching layer so controllers/services don't know
 * whether data comes from Octoparse or mock JSON
 */
export interface IDataSource {
  /**
   * Fetches all task groups
   */
  fetchTaskGroups(): Promise<OctoparseTaskGroupResponse>;

  /**
   * Fetches all tasks within a specific task group
   */
  fetchTasksByGroup(taskGroupId: string): Promise<OctoparseTaskListResponse>;

  /**
   * Fetches job data from a specific task using offset-based pagination
   */
  fetchTaskData(
    taskId: string,
    offset?: number,
    size?: number,
  ): Promise<OctoparseDataResponse>;
}
