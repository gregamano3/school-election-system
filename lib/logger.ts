/**
 * Structured logging system
 * Provides consistent logging with levels, context, and optional metadata
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  error?: Error | unknown;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.context ? `[${entry.context}]` : "",
      entry.message,
    ].filter(Boolean);

    return parts.join(" ");
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: string,
    error?: Error | unknown,
    metadata?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      context,
      error,
      metadata,
      timestamp: new Date().toISOString(),
    };
  }

  private output(entry: LogEntry): void {
    const formatted = this.formatLog(entry);

    switch (entry.level) {
      case "debug":
        if (this.isDevelopment) {
          console.debug(formatted, entry.metadata || "");
        }
        break;
      case "info":
        if (this.isDevelopment || this.isProduction) {
          console.info(formatted, entry.metadata || "");
        }
        break;
      case "warn":
        console.warn(formatted, entry.metadata || "", entry.error || "");
        break;
      case "error":
        console.error(formatted, entry.metadata || "", entry.error || "");
        // In production, you might want to send errors to an error tracking service
        // e.g., Sentry, LogRocket, etc.
        break;
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry("debug", message, context, undefined, metadata);
    this.output(entry);
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry("info", message, context, undefined, metadata);
    this.output(entry);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry("warn", message, context, error, metadata);
    this.output(entry);
  }

  /**
   * Log error messages
   */
  error(message: string, context?: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry("error", message, context, error, metadata);
    this.output(entry);
  }

  /**
   * Log API request/response
   */
  api(method: string, path: string, statusCode?: number, duration?: number, metadata?: Record<string, unknown>): void {
    const message = `${method} ${path}${statusCode ? ` ${statusCode}` : ""}${duration ? ` (${duration}ms)` : ""}`;
    const level: LogLevel = statusCode && statusCode >= 400 ? "error" : statusCode && statusCode >= 300 ? "warn" : "info";
    const entry = this.createEntry(level, message, "api", undefined, metadata);
    this.output(entry);
  }

  /**
   * Log database operations
   */
  db(operation: string, table: string, metadata?: Record<string, unknown>): void {
    const message = `${operation} on ${table}`;
    const entry = this.createEntry("debug", message, "db", undefined, metadata);
    this.output(entry);
  }

  /**
   * Log authentication events
   */
  auth(event: string, userId?: string | number, metadata?: Record<string, unknown>): void {
    const message = `Auth event: ${event}${userId ? ` (user: ${userId})` : ""}`;
    const entry = this.createEntry("info", message, "auth", undefined, metadata);
    this.output(entry);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, context?: string, metadata?: Record<string, unknown>) =>
  logger.debug(message, context, metadata);
export const logInfo = (message: string, context?: string, metadata?: Record<string, unknown>) =>
  logger.info(message, context, metadata);
export const logWarn = (message: string, context?: string, error?: Error | unknown, metadata?: Record<string, unknown>) =>
  logger.warn(message, context, error, metadata);
export const logError = (message: string, context?: string, error?: Error | unknown, metadata?: Record<string, unknown>) =>
  logger.error(message, context, error, metadata);
