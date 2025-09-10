/*
 Minimal structured logger. Ensures logs contain ISO timestamp, level, component, and version.
*/

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  component: string;
  version: string;
}

export class Logger {
  private component: string;
  private version: string;

  constructor(config: LoggerConfig) {
    this.component = config.component;
    this.version = config.version;
  }

  /**
   * Emit a structured log entry.
   */
  private log(level: LogLevel, message: string, meta?: unknown): void {
    const payload = {
      ts: new Date().toISOString(),
      level,
      component: this.component,
      version: this.version,
      message,
      meta,
    };
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](JSON.stringify(payload));
  }

  /** Debug-level log. */
  debug(message: string, meta?: unknown): void { this.log('debug', message, meta); }
  /** Info-level log. */
  info(message: string, meta?: unknown): void { this.log('info', message, meta); }
  /** Warn-level log. */
  warn(message: string, meta?: unknown): void { this.log('warn', message, meta); }
  /** Error-level log. */
  error(message: string, meta?: unknown): void { this.log('error', message, meta); }
}

/**
 * Create a namespaced logger using package version.
 */
export const createLogger = (component: string): Logger =>
  new Logger({ component, version: process.env.npm_package_version ?? '0.0.0' });


