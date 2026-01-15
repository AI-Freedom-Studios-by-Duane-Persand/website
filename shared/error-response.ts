/**
 * Standardized Error Response Format
 * 
 * All API errors must conform to this format to enable consistent error handling
 * on both backend and frontend.
 * 
 * Used by: AllExceptionsFilter, error handler middleware, frontend error parser
 */

export interface ValidationError {
  /** Field name */
  field: string;
  
  /** Validation constraint that failed */
  constraint: string;
  
  /** User-friendly error message */
  message: string;
}

export interface ApiErrorResponse {
  /** HTTP status code */
  statusCode: number;
  
  /** Technical error message (for logs) */
  message: string;
  
  /** User-friendly message (for UI) */
  userFriendlyMessage: string;
  
  /** Error code for frontend logic branches */
  errorCode?: string;
  
  /** Field-level validation errors */
  validationErrors?: ValidationError[];
  
  /** When the error occurred */
  timestamp: string;
  
  /** Request path that caused error */
  path: string;
  
  /** Request ID for tracing */
  requestId?: string;
  
  /** Additional error context */
  details?: Record<string, any>;
}

/**
 * Standard Error Response Builder
 * 
 * Used in AllExceptionsFilter to create consistent error responses
 */
export class StandardErrorResponse implements ApiErrorResponse {
  statusCode: number;
  message: string;
  userFriendlyMessage: string;
  errorCode?: string;
  validationErrors?: ValidationError[];
  timestamp: string;
  path: string;
  requestId?: string;
  details?: Record<string, any>;

  constructor(
    statusCode: number,
    message: string,
    userFriendlyMessage: string,
    path: string,
    errorCode?: string
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.userFriendlyMessage = userFriendlyMessage;
    this.path = path;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
  }

  static badRequest(
    message: string,
    userFriendlyMessage: string,
    path: string,
    validationErrors?: ValidationError[]
  ): ApiErrorResponse {
    const response = new StandardErrorResponse(
      400,
      message,
      userFriendlyMessage,
      path,
      'BAD_REQUEST'
    );
    if (validationErrors) {
      response.validationErrors = validationErrors;
    }
    return response;
  }

  static unauthorized(
    message: string,
    path: string,
    userFriendlyMessage = 'Authentication required'
  ): ApiErrorResponse {
    return new StandardErrorResponse(
      401,
      message,
      userFriendlyMessage,
      path,
      'UNAUTHORIZED'
    );
  }

  static forbidden(
    message: string,
    path: string,
    userFriendlyMessage = 'You do not have permission to access this resource'
  ): ApiErrorResponse {
    return new StandardErrorResponse(
      403,
      message,
      userFriendlyMessage,
      path,
      'FORBIDDEN'
    );
  }

  static notFound(
    resource: string,
    path: string,
    userFriendlyMessage?: string
  ): ApiErrorResponse {
    return new StandardErrorResponse(
      404,
      `${resource} not found`,
      userFriendlyMessage || `The requested ${resource.toLowerCase()} could not be found`,
      path,
      'NOT_FOUND'
    );
  }

  static conflict(
    message: string,
    path: string,
    userFriendlyMessage = 'This operation conflicts with existing data'
  ): ApiErrorResponse {
    return new StandardErrorResponse(
      409,
      message,
      userFriendlyMessage,
      path,
      'CONFLICT'
    );
  }

  static internalError(
    message: string,
    path: string,
    requestId?: string
  ): ApiErrorResponse {
    const response = new StandardErrorResponse(
      500,
      message,
      'An unexpected error occurred. Please try again later.',
      path,
      'INTERNAL_ERROR'
    );
    if (requestId) {
      response.requestId = requestId;
    }
    return response;
  }

  static serviceUnavailable(
    message: string,
    path: string,
    userFriendlyMessage = 'Service temporarily unavailable. Please try again later.'
  ): ApiErrorResponse {
    return new StandardErrorResponse(
      503,
      message,
      userFriendlyMessage,
      path,
      'SERVICE_UNAVAILABLE'
    );
  }
}
