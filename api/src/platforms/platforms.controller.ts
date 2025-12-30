import { Controller, Get } from '@nestjs/common';

@Controller('platforms')
export class PlatformsController {
  @Get()
  getPlatforms() {
    return [
      { id: 1, name: 'Instagram' },
      { id: 2, name: 'Facebook' },
      { id: 3, name: 'Twitter' },
      { id: 4, name: 'LinkedIn' },
      { id: 5, name: 'TikTok' },
    ];
  }
}