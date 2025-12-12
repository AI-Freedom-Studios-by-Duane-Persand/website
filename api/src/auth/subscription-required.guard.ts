// api/src/auth/subscription-required.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription, SubscriptionDocument } from '../models/subscriptionV2.model';
import { Package, PackageDocument } from '../models/package.model';

@Injectable()
export class SubscriptionRequiredGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>('subscriptionFeatures', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredFeatures || requiredFeatures.length === 0) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || !user.userId) throw new ForbiddenException('User not authenticated');
    // Admin bypass
    if (user.roles && (user.roles.includes('admin') || user.roles.includes('superadmin'))) return true;
    // Find active subscription
    const sub = await this.subscriptionModel.findOne({ userId: user.userId, status: 'active', validUntil: { $gte: new Date() } }).populate('packageId');
    if (!sub) {
      this.logger?.warn?.('[SubscriptionRequiredGuard] No active subscription', { userId: user.userId });
      throw new ForbiddenException('No active subscription. Please subscribe to access this feature.');
    }
    let pkg: PackageDocument | null = null;
    if (typeof sub.packageId === 'string') {
      pkg = await this.packageModel.findById(sub.packageId);
    } else {
      pkg = sub.packageId as PackageDocument;
    }
    if (!pkg) {
      this.logger?.warn?.('[SubscriptionRequiredGuard] No package found for subscription', { subId: sub._id });
      throw new ForbiddenException('Subscription package not found.');
    }
    // Check if all required features are present
    const hasAll = requiredFeatures.every(f => pkg!.features.includes(f));
    if (!hasAll) {
      this.logger?.warn?.('[SubscriptionRequiredGuard] Subscription missing required features', { userId: user.userId, requiredFeatures, pkgFeatures: pkg.features });
      throw new ForbiddenException('Your subscription does not include access to this feature.');
    }
    return true;
  }
}
