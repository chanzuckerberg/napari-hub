/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-console */

import axios from 'axios';

import { BROWSER, SERVER } from '@/constants/env';
import { LogApiResponse, LogEntry, LogLevel } from '@/types/logging';

const SEND_LOGS_TO_SERVER_WINDOW = 500;

/**
 * Class for sending logs to the Next.js server from the browser in batches.
 * This works by maintaining a queue of logs that are sent to the server for
 * logging on the server side. This class has no effect on the server since it
 * creates an interval only if `window` is defined.
 */
class BrowserToServerLogger {
  logQueue: LogEntry[] = [];

  isSendingLogs = false;

  constructor() {
    if (BROWSER) {
      window.setInterval(() => this.sendLogs(), SEND_LOGS_TO_SERVER_WINDOW);
    }
  }

  /**
   * Adds new entries for logging on the server.
   * @param logs Log entries to add
   */
  addLogs(...logs: LogEntry[]) {
    this.logQueue.push(...logs);
  }

  /**
   * Send logs stored in the log queue to the server.
   */
  private async sendLogs() {
    if (this.logQueue.length === 0 || this.isSendingLogs) {
      return;
    }

    this.isSendingLogs = true;

    try {
      const response = await axios.post('/api/logs', {
        logs: this.logQueue,
      });

      const data = response.data as LogApiResponse;

      if (data.status === 'ok') {
        this.logQueue = [];
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);

      this.logQueue.push({
        level: LogLevel.Error,
        messages: ['Error sending logs to server', `error=${error}`],
      });
    } finally {
      this.isSendingLogs = false;
    }
  }
}

// Create singleton on browser so that all loggers share the same queue.
const browserToServerLogger = new BrowserToServerLogger();

/**
 * Class for logging messages at different levels. This allows us to format log
 * messages in a standardized way and also opens up the possibility of adding
 * different transports like logging to a file on the server or logging to the
 * cloud.
 */
export class Logger {
  /**
   * Creates a new logger instance. Named loggers can be created using the
   * `name` option and can be used for showing a unique name for all log
   * messages. This is similar to `logging.getLogger(__name__)` in python.
   *
   * @param name The name for the logger
   */
  constructor(private name: string = '') {}

  log(...messages: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      this.logMessages(LogLevel.Log, messages);
    }

    browserToServerLogger.addLogs(this.getLogEntries(LogLevel.Log, messages));
  }

  debug(...messages: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      this.logMessages(LogLevel.Debug, messages);
    }

    browserToServerLogger.addLogs(this.getLogEntries(LogLevel.Debug, messages));
  }

  error(...messages: any[]): void {
    this.logMessages(LogLevel.Error, messages);
    browserToServerLogger.addLogs(this.getLogEntries(LogLevel.Error, messages));
  }

  info(...messages: any[]): void {
    this.logMessages(LogLevel.Info, messages);
    browserToServerLogger.addLogs(this.getLogEntries(LogLevel.Info, messages));
  }

  warn(...messages: any[]): void {
    this.logMessages(LogLevel.Warn, messages);
    browserToServerLogger.addLogs(this.getLogEntries(LogLevel.Warn, messages));
  }

  trace(...messages: any[]): void {
    this.logMessages(LogLevel.Trace, messages);
    browserToServerLogger.addLogs(this.getLogEntries(LogLevel.Trace, messages));
  }

  private logMessages(level: LogLevel, messages: any[]): void {
    console[level](...this.formatMessages(level, messages));
  }

  private formatMessages(level: LogLevel, messages: any[]): any[] {
    const date = new Date();

    return messages.map((message) =>
      JSON.stringify({
        level,
        date: date.toISOString(),
        type: SERVER ? 'server' : 'client',
        node_env: process.env.NODE_ENV,
        env: process.env.ENV,
        ...(this.name && { name: this.name }),
        ...message,
      }),
    );
  }

  private getLogEntries(level: LogLevel, messages: any[]): LogEntry {
    return {
      level,
      messages: this.formatMessages(level, messages),
    };
  }
}
