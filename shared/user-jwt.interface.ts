// JWT payload type for authenticated users
export interface UserJwt {
  sub: string; // user id (standard JWT subject)
  email?: string;
  roles?: string[];
  tenantId?: string;
  // Add any other custom claims here
}
