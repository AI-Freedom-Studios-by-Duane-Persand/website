// api/src/scheduling/social-publisher/ayrshare.publisher.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SocialPublisher } from './social.publisher';
import { ConfigService } from '../../integrations/config.service';
import { CreativeDocument } from '../../models/creative.schema';
import axios from 'axios';

@Injectable()
export class AyrsharePublisher implements SocialPublisher {
  constructor(private readonly configService: ConfigService) {}

  async publishOrganicPost(args: {
    tenantId: any;
    userId?: any;
    creative: CreativeDocument;
    platforms: string[];
  }): Promise<{ platformIds: Record<string, string> }> {
    const config = await this.configService.getConfig('ayrshare', args.tenantId);
    const apiKey = config.apiKey;
    if (!apiKey) throw new InternalServerErrorException('Ayrshare API key missing');
    const payload = {
      platforms: args.platforms,
      post: Array.isArray(args.creative.copy.body)
        ? args.creative.copy.body.join('\n')
        : args.creative.copy.body || args.creative.copy.caption,
      mediaUrls: args.creative.assets?.videoUrl
        ? [args.creative.assets.videoUrl]
        : args.creative.assets?.imageUrls || [],
    };
    const res = await axios.post('https://app.ayrshare.com/api/post', payload, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.data || !res.data.postIds) throw new InternalServerErrorException('Ayrshare publish failed');
    return { platformIds: res.data.postIds };
  }
}
