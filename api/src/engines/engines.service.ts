// api/src/engines/engines.service.ts

import { Injectable, ForbiddenException, Inject, Req } from '@nestjs/common';
import { ConfigService } from '../integrations/config.service';
import { GeminiClient } from './gemini.client';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EngineRun, EngineRunDocument } from '../models/engineRun.model';
import { Subscription, SubscriptionDocument } from '../models/subscriptionV2.model';
import { Package, PackageDocument } from '../models/package.model';

export interface EngineInput {
  [key: string]: any;
}
export interface EngineOutput {
  [key: string]: any;
}

export interface Engine {
  run(input: EngineInput): Promise<EngineOutput>;
}

@Injectable()
export class EnginesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly geminiClient: GeminiClient,
    @InjectModel(EngineRun.name) private engineRunModel: Model<EngineRunDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
  ) {}

  // Example: StrategyEngine
  async runStrategyEngine(input: EngineInput & { userId?: string }) {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input for StrategyEngine');
    }
    // Gating: check active subscription and package features
    const userId = input.userId;
    if (!userId) throw new ForbiddenException('User not authenticated');
    const sub = await this.subscriptionModel.findOne({ userId, status: 'active', validUntil: { $gte: new Date() } }).populate('packageId');
    if (!sub) throw new ForbiddenException('No active subscription');
    let pkg: PackageDocument | null = null;
    if (typeof sub.packageId === 'string') {
      // If not populated, fetch the package
      pkg = await this.packageModel.findById(sub.packageId);
    } else {
      pkg = sub.packageId as PackageDocument;
    }
    if (!pkg || !pkg.features.includes('strategy-engine')) {
      throw new ForbiddenException('Your subscription does not include access to the Strategy Engine');
    }
    // Log engine run
    console.log('[Engine] StrategyEngine run:', input);
    try {
      const result = await this.geminiClient.generateContent('strategy', input);
      // Save engine run to DB
      await this.engineRunModel.create({
        userId,
        engineType: 'strategy',
        input,
        output: result,
        subscriptionId: sub._id,
        status: 'success',
      });
      // Log output
      console.log('[Engine] StrategyEngine output:', result);
      return {
        success: true,
        output: result,
      };
    } catch (err) {
      await this.engineRunModel.create({
        userId,
        engineType: 'strategy',
        input,
        output: { error: err instanceof Error ? err.message : 'Unknown error' },
        subscriptionId: sub?._id,
        status: 'error',
      });
      console.error('[Engine] StrategyEngine error:', err);
      return {
        success: false,
        error: (err instanceof Error ? err.message : 'Unknown error'),
      };
    }
  }

  // Example: CopyEngine
  async runCopyEngine(input: EngineInput & { userId?: string }) {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input for CopyEngine');
    }
    // Gating: check active subscription and package features
    const userId = input.userId;
    if (!userId) throw new ForbiddenException('User not authenticated');
    const sub = await this.subscriptionModel.findOne({ userId, status: 'active', validUntil: { $gte: new Date() } }).populate('packageId');
    if (!sub) throw new ForbiddenException('No active subscription');
    let pkg: PackageDocument | null = null;
    if (typeof sub.packageId === 'string') {
      // If not populated, fetch the package
      pkg = await this.packageModel.findById(sub.packageId);
    } else {
      pkg = sub.packageId as PackageDocument;
    }
    if (!pkg || !pkg.features.includes('copy-engine')) {
      throw new ForbiddenException('Your subscription does not include access to the Copy Engine');
    }
    // Log engine run
    console.log('[Engine] CopyEngine run:', input);
    try {
      const result = await this.geminiClient.generateContent('copy', input);
      // Save engine run to DB
      await this.engineRunModel.create({
        userId,
        engineType: 'copy',
        input,
        output: result,
        subscriptionId: sub._id,
        status: 'success',
      });
      // Log output
      console.log('[Engine] CopyEngine output:', result);
      return {
        success: true,
        output: result,
      };
    } catch (err) {
      await this.engineRunModel.create({
        userId,
        engineType: 'copy',
        input,
        output: { error: err instanceof Error ? err.message : 'Unknown error' },
        subscriptionId: sub?._id,
        status: 'error',
      });
      console.error('[Engine] CopyEngine error:', err);
      return {
        success: false,
        error: (err instanceof Error ? err.message : 'Unknown error'),
      };
    }
  }
}
