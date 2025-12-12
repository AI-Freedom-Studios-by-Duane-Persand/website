import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async validateUser(username: string, password: string) {
    // TODO: Validate user from DB
    return { userId: '1', username, roles: ['tenant'] };
  }

  async login(user: any) {
    const payload = { sub: user.userId, username: user.username, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
