import { Controller, Get } from '@nestjs/common';

@Controller('platforms')
export class PlatformsController {
  @Get()
  getPlatforms() {
    return [
      { id: 1, name: 'Instagram' },
      { id: 2, name: 'Facebook' },
    ];
  }
}