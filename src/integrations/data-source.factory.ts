import { Injectable, Inject, Logger } from '@nestjs/common';
import { IDataSource } from './data-source.interface';
import { OctoparseService } from './octoparse/octoparse.service';
import { MockDataSourceService } from './mock/mock-data-source.service';
import type { AppConfig } from '../config/interface/app-config.interface';

/**
 * Factory that provides the correct data source based on configuration
 * This is the ONLY place that knows about the data source switch
 */
@Injectable()
export class DataSourceFactory {
  private readonly logger = new Logger(DataSourceFactory.name);

  constructor(
    @Inject('APP_CONFIG') private readonly config: AppConfig,
    private readonly octoparseService: OctoparseService,
    private readonly mockDataSourceService: MockDataSourceService,
  ) {}

  /**
   * Returns the active data source based on DATA_SOURCE environment variable
   */
  getDataSource(): IDataSource {
    const source = this.config.dataSource;

    if (source === 'octoparse') {
      this.logger.log('Using Octoparse data source');
      return this.octoparseService;
    }

    // Default to mock
    this.logger.log('Using Mock data source');
    return this.mockDataSourceService;
  }
}
