/**
 * Enterprise-Grade Observability & Structured Logging Utility
 * Supports JSON serialization in production for Logstash/Fluentd ingestion,
 * and high-visibility formatted output for local development.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  module?: string;
  timestamp?: string;
  durationMs?: number;
  [key: string]: any;
}

const IS_PROD = process.env.NODE_ENV === 'production';

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  
  if (IS_PROD) {
    // Structured JSON for cloud observability platforms (Datadog, GCP Cloud Logging, ELK)
    return JSON.stringify({
      level: level.toUpperCase(),
      message,
      timestamp,
      ...context
    });
  }

  // Developer-friendly localized output with colored tags
  const colors = {
    info: '\x1b[36m[INFO]\x1b[0m',
    warn: '\x1b[33m[WARN]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m',
    debug: '\x1b[35m[DEBUG]\x1b[0m'
  };

  const moduleTag = context?.module ? `\x1b[32m[${context.module}]\x1b[0m ` : '';
  const durationTag = context?.durationMs !== undefined ? ` \x1b[33m(${context.durationMs}ms)\x1b[0m` : '';
  
  // Format context keys safely
  const rawContext = { ...context };
  delete rawContext.module;
  delete rawContext.durationMs;
  const contextStr = Object.keys(rawContext).length > 0 ? ` | Context: ${JSON.stringify(rawContext)}` : '';

  return `[${timestamp}] ${colors[level]} ${moduleTag}${message}${durationTag}${contextStr}`;
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatMessage('info', message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(formatMessage('warn', message, context));
  },
  error(message: string, context?: LogContext) {
    console.error(formatMessage('error', message, context));
  },
  debug(message: string, context?: LogContext) {
    if (!IS_PROD || process.env.DEBUG === 'true') {
      console.log(formatMessage('debug', message, context));
    }
  }
};
