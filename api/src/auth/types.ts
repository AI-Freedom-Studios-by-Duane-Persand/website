import { Request } from 'express';
import { UserJwt } from '../../../shared/user-jwt.interface';

export interface JwtPayload {
  userId: string;
  email?: string;
  tenantId?: string;
  roles?: string[];
}

export interface RequestWithUser extends Request {
  user: UserJwt;
}
