/**
 * Frontend Error Handler
 *
 * Standardizes error parsing for API responses.
 */

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  userFriendlyMessage?: string;
  validationErrors?: unknown[];
  timestamp?: string;
  path?: string;
}

export function parseApiError(err: unknown): ApiErrorResponse {
  if (!err) {
    return { statusCode: 500, message: 'Unknown error' };
  }

  const anyErr = err as any;
  if (anyErr?.status && (anyErr?.data || anyErr?.message)) {
    const data = anyErr.data as Partial<ApiErrorResponse> | undefined;
    return {
      statusCode: Number(anyErr.status) || data?.statusCode || 500,
      message: data?.message || anyErr.message || 'Request failed',
      userFriendlyMessage: data?.userFriendlyMessage,
      validationErrors: data?.validationErrors,
      timestamp: data?.timestamp,
      path: data?.path,
    };
  }

  if (typeof Response !== 'undefined' && err instanceof Response) {
    return { statusCode: err.status, message: err.statusText || 'Request failed' };
  }

  if (err instanceof Error) {
    return { statusCode: 500, message: err.message };
  }

  return { statusCode: 500, message: String(err) };
}

export function getUserMessage(error: ApiErrorResponse): string {
  return error.userFriendlyMessage || error.message || 'Something went wrong';
}
