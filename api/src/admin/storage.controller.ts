import { Controller, Get, Post, Body, UseGuards, Req, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfigService } from '../integrations/config.service';
import { Request } from 'express';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { CreativesService } from '../creatives/creatives.service';

@Controller('admin/storage')
@UseGuards(JwtAuthGuard)
export class AdminStorageController {
  private readonly logger = new Logger(AdminStorageController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly creativesService: CreativesService,
  ) {}

  /**
   * Check if user is admin
   */
  private isAdmin(req: Request): boolean {
    const roles = (req as any).user?.roles || [];
    return roles.includes('admin') || roles.includes('superadmin');
  }

  /**
   * Get current R2 configuration (sensitive fields masked)
   */
  @Get('config')
  async getConfig(@Req() req: Request) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenException('Admin access required');
    }

    try {
      const tenantId = (req as any).user?.tenantId;
      const config = await this.configService.getConfig('r2', tenantId);

      if (!config) {
        return {
          bucketName: '',
          endpoint: '',
          accessKeyId: '',
          secretAccessKey: '',
          publicBaseUrl: '',
          region: 'auto',
        };
      }

      // Mask sensitive fields
      return {
        bucketName: config.bucketName || '',
        endpoint: config.endpoint || '',
        accessKeyId: config.accessKeyId ? config.accessKeyId.substring(0, 8) + '***' : '',
        secretAccessKey: config.secretAccessKey ? '***' : '',
        publicBaseUrl: config.publicBaseUrl || '',
        region: config.region || 'auto',
      };
    } catch (err: any) {
      this.logger.error('[getConfig] Error retrieving config', { error: err.message });
      throw err;
    }
  }

  /**
   * Save R2 configuration
   */
  @Post('config')
  async saveConfig(
    @Body() body: {
      bucketName: string;
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
      publicBaseUrl?: string;
      region?: string;
    },
    @Req() req: Request
  ) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenException('Admin access required');
    }

    try {
      if (!body.bucketName || !body.endpoint || !body.accessKeyId || !body.secretAccessKey) {
        throw new BadRequestException('Missing required R2 configuration fields');
      }

      const tenantId = (req as any).user?.tenantId;

      const config = {
        bucketName: body.bucketName,
        endpoint: body.endpoint,
        accessKeyId: body.accessKeyId,
        secretAccessKey: body.secretAccessKey,
        publicBaseUrl: body.publicBaseUrl || body.endpoint,
        region: body.region || 'auto',
      };

      await this.configService.setConfig('tenant', 'r2', config, tenantId);

      this.logger.log('[saveConfig] R2 config saved', {
        bucketName: config.bucketName,
        endpoint: config.endpoint,
      });

      // Return masked version
      return {
        bucketName: config.bucketName,
        endpoint: config.endpoint,
        accessKeyId: config.accessKeyId.substring(0, 8) + '***',
        secretAccessKey: '***',
        publicBaseUrl: config.publicBaseUrl,
        region: config.region,
      };
    } catch (err: any) {
      this.logger.error('[saveConfig] Error saving config', { error: err.message });
      throw err;
    }
  }

  /**
   * Test R2 connection
   */
  @Post('test')
  async testConnection(
    @Body() body: {
      bucketName: string;
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
      region?: string;
    },
    @Req() req: Request
  ) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenException('Admin access required');
    }

    try {
      if (!body.bucketName || !body.endpoint || !body.accessKeyId || !body.secretAccessKey) {
        throw new BadRequestException('Missing required R2 credentials');
      }

      const s3 = new S3Client({
        region: body.region || 'auto',
        endpoint: body.endpoint,
        credentials: {
          accessKeyId: body.accessKeyId,
          secretAccessKey: body.secretAccessKey,
        },
      });

      // Test by listing bucket metadata
      const headCmd = new HeadBucketCommand({ Bucket: body.bucketName });
      await s3.send(headCmd);

      this.logger.log('[testConnection] R2 connection successful', {
        bucketName: body.bucketName,
      });

      return {
        success: true,
        bucketName: body.bucketName,
        accessible: true,
        message: 'Connection successful',
      };
    } catch (err: any) {
      this.logger.error('[testConnection] R2 connection failed', {
        error: err.message,
        code: err.$metadata?.httpStatusCode,
      });

      return {
        success: false,
        accessible: false,
        error: err.message,
        message: 'Connection failed - check credentials and endpoint',
      };
    }
  }

  /**
   * Admin-only helper to refresh all creative image URLs to fresh signed URLs.
   * Uses CreativesService.refreshAllCreativeImageUrls under the hood.
   */
  @Post('refresh-creative-image-urls')
  async refreshCreativeImageUrls(
    @Body() body: { tenantId?: string },
    @Req() req: Request,
  ) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenException('Admin access required');
    }

    const user: any = (req as any).user || {};
    const currentTenantId = user?.tenantId?.toString();
    const requestedTenantId = body?.tenantId;

    // Only superadmins can override the tenant context explicitly
    if (requestedTenantId && user?.role !== 'superadmin') {
      throw new ForbiddenException('Only superadmins can override tenantId');
    }

    const targetTenantId = user?.role === 'superadmin' && requestedTenantId
      ? requestedTenantId
      : currentTenantId;

    if (!targetTenantId) {
      throw new BadRequestException('No tenantId available for refresh operation');
    }

    const result = await this.creativesService.refreshAllCreativeImageUrls(targetTenantId);

    this.logger.log('[refreshCreativeImageUrls] Completed refresh via admin endpoint', {
      tenantId: targetTenantId,
      ...result,
    });

    return result;
  }
}
