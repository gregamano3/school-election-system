/**
 * Error sanitization utilities
 * Prevents information disclosure in error messages
 */

import { logger } from "./logger";

/**
 * Sanitize error messages for user-facing responses
 * Logs detailed errors server-side but returns generic messages to clients
 */
export function sanitizeError(error: unknown, context?: string): { message: string; logMessage: string } {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logMessage = context ? `[${context}] ${errorMessage}` : errorMessage;

  // Log detailed error server-side using structured logger
  logger.error(logMessage, context, error instanceof Error ? error : undefined);

  // Return generic message for client
  // Don't expose internal details like database errors, file paths, etc.
  if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("database")) {
    return { message: "Service temporarily unavailable", logMessage };
  }

  if (errorMessage.includes("ENOENT") || errorMessage.includes("file")) {
    return { message: "Resource not found", logMessage };
  }

  if (errorMessage.includes("permission") || errorMessage.includes("access")) {
    return { message: "Access denied", logMessage };
  }

  // Generic fallback
  return { message: "An error occurred. Please try again.", logMessage };
}

/**
 * Sanitize API error responses
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  context?: string
): Response {
  const { message } = sanitizeError(error, context);
  return Response.json({ error: message }, { status: statusCode });
}
