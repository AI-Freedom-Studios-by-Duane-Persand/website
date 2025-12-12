// api/src/auth/auth.controller.ts
import { Controller, Post, Body, UnauthorizedException, BadRequestException, Options, Logger, Get, Req, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { TenantsService } from '../tenants/tenants.service';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const user = await this.authService.validateUser(body.email, body.password);
      if (!user) throw new UnauthorizedException('Invalid credentials');
      const result = await this.authService.login(user);
      // Set JWT as HttpOnly cookie for SSR/universal support
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
      return result;
    } catch (err) {
      const stack = typeof err === 'object' && err !== null && 'stack' in err ? (err as any).stack : String(err);
      const message = typeof err === 'object' && err !== null && 'message' in err ? (err as any).message : 'Unknown error';
      this.logger.error('Login failed', stack);
      throw new UnauthorizedException('Login failed: ' + message);
    }
  }

  @Post('signup')
  async signup(@Body() body: { email: string; password: string; tenant: string }) {
    if (!body.email || !body.password || !body.tenant) {
      throw new BadRequestException('Missing required fields');
    }
    // Atomically find or create tenant
    const tenant = await this.tenantsService.findOrCreateByName(body.tenant);
    const tenantId = tenant._id.toString();
    // Check for existing user in this tenant
    const existing = await this.usersService.findByEmail(body.email, tenantId);
    if (existing) throw new BadRequestException('Email already in use');
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await this.usersService.create({
      email: body.email,
      password: '', // not used, but required by DTO
      passwordHash,
      tenantId,
      role: 'tenantOwner',
      roles: ['tenantOwner'],
      name: body.email.split('@')[0],
    });
    return { success: true, userId: user._id };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    return req.user || null;
  }
}
