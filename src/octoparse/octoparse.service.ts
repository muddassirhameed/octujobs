import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { OctoparseTokenResponse } from './interfaces/token.interface';
import { OctoparseTaskListResponse } from './interfaces/task.interface';
import { OctoparseDataResponse } from './interfaces/data.interface';

@Injectable()
export class OctoparseService {
  private readonly logger = new Logger(OctoparseService.name);
  private readonly http: AxiosInstance;

  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {
    this.http = axios.create({
      baseURL: 'https://openapi.octoparse.com',
      timeout: 15000,
    });
  }

  // =============================
  // AUTH / TOKEN
  // =============================

  private async authenticate(): Promise<void> {
    const now = Date.now();

    if (this.accessToken && now < this.tokenExpiresAt) {
      return;
    }

    this.logger.log('Authenticating with Octoparse...');

    const response = await this.http.post<OctoparseTokenResponse>('/token', {
      username: this.configService.get<string>('OCTOPARSE_USERNAME'),
      password: this.configService.get<string>('OCTOPARSE_PASSWORD'),
    });

    const token = response.data.data;

    this.accessToken = token.access_token;
    this.tokenExpiresAt = now + token.expires_in * 1000;

    this.logger.log('Octoparse token acquired');
  }

  private async getAuthHeaders(): Promise<{ Authorization: string }> {
    await this.authenticate();
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  // =============================
  // TASK LIST
  // =============================

  async fetchTasks(): Promise<OctoparseTaskListResponse> {
    const headers = await this.getAuthHeaders();

    const response = await this.http.get<OctoparseTaskListResponse>(
      '/openapi/task/list',
      { headers },
    );

    return response.data;
  }

  // =============================
  // TASK DATA
  // =============================

  async fetchTaskData(
    taskId: string,
    offset = 0,
    size = 100,
  ): Promise<OctoparseDataResponse> {
    const headers = await this.getAuthHeaders();

    const response = await this.http.get<OctoparseDataResponse>(
      `/openapi/task/data/${taskId}`,
      {
        headers,
        params: { offset, size },
      },
    );

    return response.data;
  }
}
