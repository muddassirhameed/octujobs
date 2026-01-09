import { Injectable, Logger, Inject } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { OctoparseTokenResponse } from './interfaces/token.interface';
import {
  OctoparseTaskGroupResponse,
  OctoparseTaskListResponse,
} from './interfaces/task.interface';
import { OctoparseDataResponse } from './interfaces/data.interface';
import type { AppConfig } from '../../config/interface/app-config.interface';

@Injectable()
export class OctoparseService {
  private readonly logger = new Logger(OctoparseService.name);
  private readonly http: AxiosInstance;
  private readonly dataApi: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(@Inject('APP_CONFIG') private readonly config: AppConfig) {
    // Used for management and metadata
    this.http = axios.create({
      baseURL: 'https://openapi.octoparse.com',
      timeout: 30000,
    });
    // Used for getting the data that tasks have scraped
    this.dataApi = axios.create({
      baseURL: 'https://dataapi.octoparse.com',
      timeout: 30000,
    });
  }

  // Authenticates with Octoparse API and stores the access token with expiration
  private async authenticate(): Promise<void> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt) {
      return;
    }
    this.logger.log('Authenticating with Octoparse...');
    try {
      const response = await this.http.post<OctoparseTokenResponse>(
        '/token',
        {
          username: this.config.octoparseUsername,
          password: this.config.octoparsePassword,
          grant_type: 'password',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const token = response.data.data;
      if (!token?.access_token) {
        throw new Error('Invalid token response from Octoparse');
      }
      this.accessToken = token.access_token;
      const expiresIn =
        typeof token.expires_in === 'string'
          ? Number.parseInt(token.expires_in, 10)
          : token.expires_in;
      if (Number.isNaN(expiresIn) || expiresIn <= 0) {
        throw new Error('Invalid expires_in value in token response');
      }
      const expiresInMs = expiresIn * 1000;
      this.tokenExpiresAt = now + expiresInMs - 60000;
      this.logger.log('Octoparse token acquired successfully');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to authenticate with Octoparse: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  // Returns authentication headers with Bearer token for API requests
  private async getAuthHeaders(): Promise<Record<string, string>> {
    await this.authenticate();
    if (!this.accessToken) {
      throw new Error('Access token is not available');
    }
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // Fetches all task groups from Octoparse API
  async fetchTaskGroups(): Promise<OctoparseTaskGroupResponse> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get<OctoparseTaskGroupResponse>(
      '/taskGroup',
      { headers },
    );
    return response.data;
  }

  // Fetches all tasks within a specific task group from Octoparse API
  async fetchTasksByGroup(
    taskGroupId: string,
  ): Promise<OctoparseTaskListResponse> {
    if (
      !taskGroupId ||
      typeof taskGroupId !== 'string' ||
      taskGroupId.trim() === ''
    ) {
      throw new Error('Invalid taskGroupId provided');
    }
    const headers = await this.getAuthHeaders();
    const response = await this.http.get<OctoparseTaskListResponse>(
      `/task/search?taskGroupId=${encodeURIComponent(taskGroupId.trim())}`,
      { headers },
    );
    return response.data;
  }

  // Fetches job data from a specific task using offset-based pagination
  async fetchTaskData(
    taskId: string,
    offset = 0,
    size = 100,
  ): Promise<OctoparseDataResponse> {
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      throw new Error('Invalid taskId provided');
    }
    const safeOffset = Math.max(0, Math.floor(offset));
    const safeSize = Math.max(1, Math.min(1000, Math.floor(size)));

    const headers = await this.getAuthHeaders();
    const response = await this.dataApi.get<OctoparseDataResponse>(
      `/api/alldata/GetDataOfTaskByOffset`,
      {
        headers,
        params: {
          taskId: taskId.trim(),
          offset: safeOffset,
          size: safeSize,
        },
      },
    );
    return response.data;
  }
}
