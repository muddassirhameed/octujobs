export interface SchedulerStatus {
  isRunning: boolean;
  lastRun?: Date;
  message: string;
}
