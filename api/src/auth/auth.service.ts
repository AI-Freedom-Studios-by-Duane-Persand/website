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
      const payload = {
        sub: user._id.toString(), // Add user ID as sub
        email: user.email, // Add user email
        tenantId: user.tenantId, // Add tenant ID
        roles: [user.role],
      };
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
