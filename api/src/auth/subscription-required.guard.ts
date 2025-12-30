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
    // Use 'sub' from JWT payload (user ID) - from JwtStrategy validate method
    const userId = user?.sub || user?.userId;
    if (!user || !userId) throw new ForbiddenException('User not authenticated');
    // Admin bypass
    if (user.roles && (user.roles.includes('admin') || user.roles.includes('superadmin'))) return true;
    // Development mode: bypass if NODE_ENV is development (for testing)
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_SUBSCRIPTION_CHECK === 'true') {
      this.logger?.warn?.('[SubscriptionRequiredGuard] Skipping subscription check in development mode', { userId: userId });
      return true;
    }
    // Find active subscription - allow subscriptions without validUntil OR with validUntil >= now
    const sub = await this.subscriptionModel.findOne({ 
      userId: userId, 
      status: 'active', 
      $or: [
        { validUntil: { $gte: new Date() } },
        { validUntil: null }
      ]
    }).populate('packageId');
    if (!sub) {
      this.logger?.warn?.('[SubscriptionRequiredGuard] No active subscription', { userId: userId });
      // Debug: check what subscriptions exist for this user
      const allSubs = await this.subscriptionModel.find({ userId: userId }).lean();
      this.logger?.warn?.('[SubscriptionRequiredGuard] All subscriptions for user', { userId: userId, subs: allSubs });
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
      this.logger?.warn?.('[SubscriptionRequiredGuard] Subscription missing required features', { userId: userId, requiredFeatures, pkgFeatures: pkg.features });
      throw new ForbiddenException('Your subscription does not include access to this feature.');
    }
    return true;
  }
}
