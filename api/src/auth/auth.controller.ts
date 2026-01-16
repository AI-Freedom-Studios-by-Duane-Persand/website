// api/src/auth/auth.controller.ts
import { Controller, Post, Body, UnauthorizedException, BadRequestException, Options, Logger, Get, Req, UseGuards, Res, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthApplicationService } from './auth-application.service';
import { TenantsService } from '../tenants/tenants.service';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EarlyAccessRequestDocument } from './early-access-requests.schema';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly authApplicationService: AuthApplicationService,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly subscriptionsService: SubscriptionsService,
    @InjectModel('EarlyAccessRequest') private readonly earlyAccessRequestModel: Model<EarlyAccessRequestDocument>,
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
    return this.authApplicationService.signup({
      email: body.email,
      password: body.password,
      tenant: body.tenant,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const user = req.user as UserJwt; // Explicitly cast req.user to UserJwt
    const userId = user?.sub; // Access the sub property from UserJwt

    // Debugging log for req.user
    console.debug('[AuthController][me] req.user:', req.user);

    if (!userId) {
      console.error('[AuthController][me] Missing userId in req.user:', req.user);
      throw new BadRequestException('User ID not found');
    }

    const userRecord = await this.usersService.findOneGlobal(userId); // Use global method to bypass tenant context
    if (!userRecord) {
      console.error('[AuthController][me] User not found for userId:', userId);
      throw new NotFoundException('User not found');
    }

    return {
      userId: userId,
      email: userRecord.email,
      roles: userRecord.roles,
      isEarlyAccess: userRecord.isEarlyAccess || false,
    };
  }

  @Post('early-access/request')
  async requestEarlyAccess(@Body() body: { email: string }) {
    if (!body.email || !body.email.includes('@')) {
      throw new BadRequestException('Valid email required');
    }

    try {
      const normalizedEmail = body.email.toLowerCase().trim();
      
      // Check if already requested
      const existing = await this.earlyAccessRequestModel.findOne({ email: normalizedEmail });
      if (existing) {
        return { success: true, message: 'Email already registered for early access' };
      }

      // Create new request
      await this.earlyAccessRequestModel.create({
        email: normalizedEmail,
        requestedAt: new Date(),
        status: 'pending',
      });

      this.logger.log(`Early access request received: ${normalizedEmail}`);
      
      return { success: true, message: 'Early access request submitted' };
    } catch (error) {
      this.logger.error('Failed to process early access request', error);
      throw new InternalServerErrorException('Failed to submit early access request');
    }
  }
}

// Ensure req.user type includes sub property
interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    [key: string]: any;
  };
}
