export interface AppConfig {
  appName: string;
  environment: 'development' | 'production';
  port: number;
  mongodbUri: string;
  octoparseUsername: string;
  octoparsePassword: string;
  scrapeIntervalSeconds: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
