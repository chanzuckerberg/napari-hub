/*
  eslint-disable
    @typescript-eslint/no-explicit-any,
    @typescript-eslint/no-unsafe-argument,
    no-console,
*/

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
      console.log(...this.formatMessages(messages));
    }
  }

  debug(...messages: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...this.formatMessages(messages));
    }
  }

  error(...messages: any[]): void {
    console.error(...this.formatMessages(messages));
  }

  info(...messages: any[]): void {
    console.info(...this.formatMessages(messages));
  }

  warn(...messages: any[]): void {
    console.warn(...this.formatMessages(messages));
  }

  trace(...messages: any[]): void {
    console.trace(...this.formatMessages(messages));
  }

  private formatMessages(messages: any[]): any[] {
    const date = new Date();
    return [`[${date.toISOString()}]`, this.name && `[${this.name}]`]
      .filter(Boolean)
      .concat(messages);
  }
}
