/**
 * JWT Payload Interface
 * Represents the standard JWT payload structure for authenticated requests
 */

export interface JwtPayload {
  sub: string; // User ID (standard JWT subject claim)
  email?: string;
  tenantId?: string;
  role?: string;
  roles?: string[];
  isAdmin?: boolean;
  metadata?: Record<string, any>;
  iat?: number; // Issued at
  exp?: number; // Expiration
}
