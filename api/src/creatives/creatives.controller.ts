import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CreativesService } from './creatives.service';
import { CreateCreativeDto, UpdateCreativeDto } from '../../../shared/creative.dto';

@Controller('creatives')
export class CreativesController {
  constructor(private readonly creativesService: CreativesService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.creativesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.creativesService.findOne(id);
  }

  @Post()
  async create(@Body() createCreativeDto: CreateCreativeDto) {
    return this.creativesService.create(createCreativeDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCreativeDto: UpdateCreativeDto) {
    return this.creativesService.update(id, updateCreativeDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.creativesService.remove(id);
  }
}
