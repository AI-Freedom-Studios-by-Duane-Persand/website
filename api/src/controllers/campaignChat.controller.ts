import { Controller, Post, Body, Param, Get, Req, UseGuards, BadRequestException, UploadedFiles, UseInterceptors, LoggerService, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CampaignChatService } from '../services/campaignChat.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

export interface UserJwt {
  sub: string;
  email: string;
  tenantId: string;
  roles?: string[];
}

@Controller('campaign-chat')
export class CampaignChatController {
  constructor(
    private readonly chatService: CampaignChatService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  @Post('start/:campaignId')
  @UseGuards(AuthGuard('jwt'))
  async startSession(
    @Param('campaignId') campaignId: string,
    @Req() req: any,
  ) {
    this.logger.log(`POST /campaign-chat/start/${campaignId}`);
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      this.logger.error('[startSession] Missing tenantId in JWT payload');
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    const callerUserId = user.sub || user.email || 'anonymous-user';
    const result = await this.chatService.startSession(campaignId, callerUserId, user.tenantId);
    // Return session + first prompt
    return result;
  }

  @Post('message/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  async addMessage(
    @Param('sessionId') sessionId: string,
    @Body('message') message: string,
    @Body('skip') skip: boolean,
    @Body('recommend') recommend: boolean,
    @Body('websiteUrl') websiteUrl: string,
    @Req() req: any,
  ) {
    this.logger.log(`POST /campaign-chat/message/${sessionId} skip=${Boolean(skip)} recommend=${Boolean(recommend)}`);
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    // User message or action
    if (skip) {
      const stepResult = await this.chatService.handleUserInput(sessionId, '', { skip: true });
      await this.chatService.addMessage(sessionId, 'system', stepResult.prompt, stepResult.stepKey);
      return { prompt: stepResult.prompt, consideration: stepResult.consideration, skipped: true };
    }
    if (recommend) {
      const stepResult = await this.chatService.handleUserInput(sessionId, '', { recommend: true });
      await this.chatService.addMessage(sessionId, 'system', stepResult.aiRecommendation || '', stepResult.stepKey);
      return { prompt: stepResult.prompt, consideration: stepResult.consideration, aiRecommendation: stepResult.aiRecommendation, campaignId: (stepResult as any)?.campaignId };
    }
    
    // Handle website URL submission
    if (websiteUrl) {
      await this.chatService.addMessage(sessionId, 'user', `🌐 Website for analysis: ${websiteUrl}`, '');
      const websiteInfo = await this.chatService.attachWebsite(sessionId, websiteUrl);
      
      // Step progression after website analysis
      const stepResult = await this.chatService.handleUserInput(sessionId, '');
      
      if (websiteInfo?.insights && websiteInfo.insights.length > 0) {
        const insightMsg = `✓ Website analyzed successfully. Extracted ${websiteInfo.insights.length} insights to enhance your campaign.`;
        await this.chatService.addMessage(sessionId, 'system', insightMsg, stepResult.stepKey);
      }
      
      if (!stepResult.done && stepResult.prompt) {
        await this.chatService.addMessage(sessionId, 'system', stepResult.prompt, stepResult.stepKey);
      }
      
      return { 
        prompt: stepResult.prompt, 
        consideration: stepResult.consideration, 
        insights: websiteInfo?.insights || [], 
        extracted: stepResult.extracted,
        done: stepResult.done,
        campaignId: (stepResult as any)?.campaignId,
      };
    }
    
    // Regular message handling
    await this.chatService.addMessage(sessionId, 'user', message || '', '');
    
    // Step progression and validation
    const stepResult = await this.chatService.handleUserInput(sessionId, message);
    if (stepResult.error) {
      await this.chatService.addMessage(sessionId, 'system', stepResult.error, stepResult.stepKey);
      return { prompt: stepResult.prompt, consideration: stepResult.consideration, error: stepResult.error };
    }
    if (!stepResult.done) {
      await this.chatService.addMessage(sessionId, 'system', stepResult.prompt, stepResult.stepKey);
      return { prompt: stepResult.prompt, consideration: stepResult.consideration, insights: stepResult.insights, extracted: stepResult.extracted, campaignId: (stepResult as any)?.campaignId };
    }
    await this.chatService.addMessage(sessionId, 'system', 'Campaign setup complete!', '');
    return { done: true };
  }

  @Post('website/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  async attachWebsite(
    @Param('sessionId') sessionId: string,
    @Body('url') url: string,
    @Req() req: any,
  ) {
    if (!url) throw new BadRequestException('Missing url');
    const info = await this.chatService.attachWebsite(sessionId, url);
    return { success: true, website: info };
  }

  @Post('upload/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('files'))
  async uploadAssets(
    @Param('sessionId') sessionId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!files || !files.length) throw new BadRequestException('No files');
    
    // Create user message for file upload
    const fileNames = files.map(f => f.originalname).join(', ');
    const fileListMsg = files.length === 1 
      ? `📎 Uploaded: ${fileNames}`
      : `📎 Uploaded ${files.length} files: ${fileNames}`;
    await this.chatService.addMessage(sessionId, 'user', fileListMsg, '');
    
    const uploaded = await this.chatService.attachAssets(sessionId, files, user?.tenantId);
    
    // Create system confirmation message
    const successMsg = uploaded.length === 1
      ? `✓ Asset uploaded successfully and added to your campaign library`
      : `✓ ${uploaded.length} assets uploaded successfully and added to your campaign library`;
    await this.chatService.addMessage(sessionId, 'system', successMsg, '');
    
    return { success: true, uploaded };
  }

  @Get('messages/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  async getSessionMessages(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    const user: UserJwt = req.user;
    if (!user || !user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }
    return this.chatService.getSessionMessages(sessionId);
  }

  // List creatives for the session's linked campaign
  @Get('creatives/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  async listCreatives(
    @Param('sessionId') sessionId: string,
  ) {
    return this.chatService.listCreativesForSession(sessionId);
  }

  // Generate assets via session
  @Post('generate/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  async generateAssets(
    @Param('sessionId') sessionId: string,
    @Body() body: { kind: 'text' | 'image' | 'video' | 'all'; prompt?: string; model?: string }
  ) {
    const out = await this.chatService.generateAssetsViaSession(sessionId, body.kind, body.prompt, body.model);
    return { generated: out };
  }
}
