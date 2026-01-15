/**
 * Centralized Error Handler for Frontend
 * Parses, logs, and formats API errors for UI display
 */
import toast from 'react-hot-toast';

export interface FormattedError {
  message: string;
  userMessage: string;
  statusCode?: number;
  validationErrors?: Record<string, string[]>;
  timestamp: string;
}

/**
 * Parse API error response
 */
export function parseApiError(error: any): FormattedError {
  const timestamp = new Date().toISOString();

  // Handle fetch network errors
  if (!error.details && error instanceof Error) {
    return {
      message: error.message,
      userMessage: error.message,
      timestamp,
    };
  }

  const details = error.details || error;

  // Parse validation errors
  const validationErrors: Record<string, string[]> = {};
  if (details.validationErrors && Array.isArray(details.validationErrors)) {
    details.validationErrors.forEach((err: any) => {
      if (!validationErrors[err.field]) {
        validationErrors[err.field] = [];
      }
      validationErrors[err.field].push(err.message);
    });
  }

  return {
    message: details.message || 'Unknown error',
    userMessage: details.userFriendlyMessage || details.message || 'An error occurred',
    statusCode: details.statusCode,
    validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
    timestamp,
  };
}

/**
 * Log error with context
 */
export function logError(error: any, context: string = 'API Error'): FormattedError {
  const formatted = parseApiError(error);

  console.error(`[${context}]`, {
    message: formatted.message,
    statusCode: formatted.statusCode,
    timestamp: formatted.timestamp,
    validationErrors: formatted.validationErrors,
    raw: error,
  });

  return formatted;
}

/**
 * Show error toast notification
 */
export function showErrorToast(error: any, context: string = 'Operation failed'): void {
  const formatted = logError(error, context);
  toast.error(formatted.userMessage);
}

/**
 * Show success toast notification
 */
export function showSuccessToast(message: string): void {
  toast.success(message);
}

/**
 * Show warning toast notification
 */
export function showWarningToast(message: string): void {
  toast(message);
}

/**
 * Get error message for form field
 */
export function getFieldError(formatted: FormattedError, field: string): string | undefined {
  if (!formatted.validationErrors) return undefined;
  const errors = formatted.validationErrors[field];
  return errors && errors.length > 0 ? errors[0] : undefined;
}

/**
 * Handle form submission error
 */
export interface FormError {
  [key: string]: string;
}

export function handleFormError(error: any): FormError {
  const formatted = parseApiError(error);

  if (formatted.validationErrors) {
    const formErrors: FormError = {};
    Object.keys(formatted.validationErrors).forEach((field) => {
      formErrors[field] = formatted.validationErrors![field][0];
    });
    return formErrors;
  }

  return {
    _root: formatted.userMessage,
  };
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on 4xx errors except 429 (rate limit)
      if (
        error instanceof Error &&
        error.message.includes('statusCode') &&
        !error.message.includes('429')
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        console.warn(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
