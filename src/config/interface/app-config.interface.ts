export interface AppConfig {
  appName: string;
  environment: 'development' | 'production';
  port: number;
  MONGO_URL: string;
  octoparseUsername: string;
  octoparsePassword: string;
  scrapeIntervalSeconds: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dataSource: 'octoparse' | 'mock';
}
