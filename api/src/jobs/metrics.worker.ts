import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MetricsService } from '../metrics/metrics.service';
import { TenantsService } from '../tenants/tenants.service';
import { TenantDocument } from '../tenants/schemas/tenant.schema';

@Injectable()
export class MetricsSyncWorker {
  private readonly logger = new Logger(MetricsSyncWorker.name);

  constructor(
    private readonly metricsService: MetricsService,
    private readonly tenantsService: TenantsService,
  ) {}

  // Runs every 10 minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncMetricsForAllTenants() {
    this.logger.log('Starting metrics sync for all tenants');
    const tenants = await this.tenantsService.findAll({});
    for (const tenant of tenants) {
      try {
        await this.metricsService.syncTenantMetrics(tenant._id.toString());
        this.logger.log(`Metrics synced for tenant ${tenant._id}`);
      } catch (err) {
        this.logger.error(`Failed to sync metrics for tenant ${tenant._id}`, (err instanceof Error ? err.stack : String(err)));
      }
    }
  }
}
