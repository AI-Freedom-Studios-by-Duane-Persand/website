import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignDocument } from '../../models/campaign.schema';
import { AddScheduleDto, UpdateScheduleSlotDto, LockScheduleSlotDto } from '../dto/schedule.dto';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
  ) {}

  /**
   * Generate auto-schedule based on campaign strategy
   */
  async generateAutoSchedule(
    campaignId: string, 
    userId: string, 
    tenantId: string
  ): Promise<CampaignDocument> {
    this.logger.log(`Generating auto-schedule for campaign ${campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    // Get latest strategy version
    const activeStrategies = campaign.strategyVersions.filter((s: any) => !s.invalidated);
    if (activeStrategies.length === 0) {
      throw new BadRequestException('No active strategy version found');
    }

    const latestStrategy = activeStrategies[activeStrategies.length - 1];

    // Parse cadence (e.g., "3x/week", "daily", "5x/week")
    const postsPerWeek = this.parseCadence(latestStrategy.cadence);
    
    // Generate slots for next 4 weeks
    const slots = this.generateTimeSlots(postsPerWeek, latestStrategy.platforms, 4);

    // Add slots to campaign, preserving locked slots
    const existingLockedSlots = campaign.schedule.filter((s: any) => s.locked);
    
    campaign.schedule = [
      ...existingLockedSlots,
      ...slots.map(slot => ({
        slot: slot.date,
        locked: false,
        contentVersion: 1,
        platform: slot.platform,
        conflict: false,
        regenerated: false,
      })),
    ];

    // Check for conflicts (multiple posts same day/platform)
    this.detectConflicts(campaign);

    const now = new Date();
    campaign.statusHistory.push({
      status: 'schedule_generated',
      changedAt: now,
      changedBy: userId,
      note: `Auto-generated ${slots.length} schedule slots`,
    });

    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: userId,
      changes: { scheduleGenerated: true, slotsCount: slots.length },
      note: 'Auto-schedule generated',
    });

    // Set schedule approval to pending
    campaign.approvalStates.schedule = 'pending';

    await campaign.save();
    this.logger.log(`Generated ${slots.length} schedule slots`);
    return campaign;
  }

  /**
   * Manually add schedule slots
   */
  async addScheduleSlots(dto: AddScheduleDto, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Adding ${dto.slots.length} schedule slots to campaign ${dto.campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    // Add new slots
    dto.slots.forEach(slot => {
      campaign.schedule.push({
        slot: slot.slot,
        locked: slot.locked || false,
        contentVersion: 1,
        platform: slot.platform,
        conflict: false,
        regenerated: false,
      });
    });

    this.detectConflicts(campaign);

    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { addedSlots: dto.slots.length },
      note: dto.note || 'Schedule slots added manually',
    });

    campaign.approvalStates.schedule = 'pending';

    await campaign.save();
    this.logger.log(`Added ${dto.slots.length} schedule slots`);
    return campaign;
  }

  /**
   * Update a schedule slot time
   */
  async updateScheduleSlot(dto: UpdateScheduleSlotDto, tenantId: string): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    const slotIndex = campaign.schedule.findIndex(
      (s: any) => s.slot.getTime() === dto.originalSlot.getTime()
    );

    if (slotIndex === -1) {
      throw new NotFoundException('Schedule slot not found');
    }

    const slot = campaign.schedule[slotIndex];
    if (slot.locked) {
      throw new BadRequestException('Cannot update locked slot');
    }

    campaign.schedule[slotIndex].slot = dto.newSlot;
    campaign.schedule[slotIndex].regenerated = true;
    campaign.schedule[slotIndex].regeneratedAt = new Date();
    campaign.schedule[slotIndex].regeneratedBy = dto.userId;

    this.detectConflicts(campaign);

    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { updatedSlot: { from: dto.originalSlot, to: dto.newSlot } },
      note: 'Schedule slot updated',
    });

    campaign.approvalStates.schedule = 'pending';

    await campaign.save();
    this.logger.log('Schedule slot updated');
    return campaign;
  }

  /**
   * Lock or unlock a schedule slot
   */
  async toggleSlotLock(dto: LockScheduleSlotDto, tenantId: string): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    const slotIndex = campaign.schedule.findIndex(
      (s: any) => s.slot.getTime() === dto.slot.getTime()
    );

    if (slotIndex === -1) {
      throw new NotFoundException('Schedule slot not found');
    }

    campaign.schedule[slotIndex].locked = dto.locked;

    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { slotLocked: { slot: dto.slot, locked: dto.locked } },
      note: dto.locked ? 'Slot locked' : 'Slot unlocked',
    });

    await campaign.save();
    this.logger.log(`Slot ${dto.locked ? 'locked' : 'unlocked'}`);
    return campaign;
  }

  /**
   * Get all schedule slots for a campaign
   */
  async getSchedule(campaignId: string, tenantId: string): Promise<any[]> {
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    return campaign.schedule || [];
  }

  /**
   * Delete unlocked schedule slots
   */
  async clearUnlockedSlots(campaignId: string, userId: string, tenantId: string): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const lockedSlots = campaign.schedule.filter((s: any) => s.locked);
    const removedCount = campaign.schedule.length - lockedSlots.length;

    campaign.schedule = lockedSlots;

    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: userId,
      changes: { clearedSlots: removedCount },
      note: 'Unlocked slots cleared',
    });

    await campaign.save();
    this.logger.log(`Cleared ${removedCount} unlocked slots`);
    return campaign;
  }

  // Helper methods

  private parseCadence(cadence: string): number {
    const lower = cadence.toLowerCase();
    if (lower.includes('daily')) return 7;
    const match = lower.match(/(\d+)x?\s*\/?\s*week/i);
    if (match) return parseInt(match[1], 10);
    return 3; // Default to 3x/week
  }

  private generateTimeSlots(
    postsPerWeek: number, 
    platforms: string[], 
    weeks: number
  ): Array<{ date: Date; platform: string }> {
    const slots: Array<{ date: Date; platform: string }> = [];
    const now = new Date();
    
    // Best posting times by platform (9am, 12pm, 3pm, 6pm)
    const bestTimes = [9, 12, 15, 18];
    
    for (let week = 0; week < weeks; week++) {
      for (let post = 0; post < postsPerWeek; post++) {
        const dayOffset = Math.floor((post * 7) / postsPerWeek);
        const date = new Date(now);
        date.setDate(date.getDate() + (week * 7) + dayOffset);
        date.setHours(bestTimes[post % bestTimes.length], 0, 0, 0);
        
        const platform = platforms[post % platforms.length];
        slots.push({ date, platform });
      }
    }
    
    return slots;
  }

  private detectConflicts(campaign: CampaignDocument): void {
    const slotMap = new Map<string, number>();
    
    campaign.schedule.forEach((slot: any, index: number) => {
      const key = `${slot.platform}-${slot.slot.toDateString()}`;
      const count = slotMap.get(key) || 0;
      slotMap.set(key, count + 1);
      
      if (count > 0) {
        slot.conflict = true;
        slot.conflictReason = 'Multiple posts scheduled for same day/platform';
      } else {
        slot.conflict = false;
        slot.conflictReason = undefined;
      }
    });
  }
}
