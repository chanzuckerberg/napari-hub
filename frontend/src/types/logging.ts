export enum LogLevel {
  Log = 'log',
  Debug = 'debug',
  Error = 'error',
  Info = 'info',
  Warn = 'warn',
  Trace = 'trace',
}

export interface LogEntry {
  level: LogLevel;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
}

export interface LogApiErrorResponse {
  status: 'error';
  error: string;
}

export interface LogApiSuccessResponse {
  status: 'ok';
}

export type LogApiResponse = LogApiSuccessResponse | LogApiErrorResponse;
