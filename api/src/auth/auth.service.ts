// api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  }

  async login(user: any) {
    try {
      // Support both legacy 'role' and new 'roles' array for compatibility
      const payload: any = {
        sub: user._id,
        tenantId: user.tenantId,
        email: user.email,
      };
      // If user.roles exists and is array, use it; else fallback to user.role
      if (Array.isArray(user.roles) && user.roles.length > 0) {
        payload.roles = user.roles;
        // For legacy compatibility, also set role to first role if only one
        if (user.roles.length === 1) {
          payload.role = user.roles[0];
        }
      } else if (user.role) {
        payload.role = user.role;
        payload.roles = [user.role];
      }
      return {
        token: this.jwtService.sign(payload),
      };
    } catch (error) {
      // Defensive logging: avoid property access on empty object
      const details = (error && typeof error === 'object') ? {
        name: (error as any).name || 'Unknown',
        message: (error as any).message || 'No message',
        stack: (error as any).stack || '',
        error,
      } : { error };
      console.error('[AuthService][login] Exception:', details);
      throw error;
    }
  }
}
