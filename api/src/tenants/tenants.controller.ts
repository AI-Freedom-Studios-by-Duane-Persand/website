import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dtos/tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.tenantsService.findAll(query);
  }

  @Get('ids-names')
  async getTenantIdsAndNames() {
    // Only fetch _id and name for efficiency
    const tenants = await this.tenantsService.findAllFieldsOnly(['_id', 'name']);
    return tenants.map(t => ({ id: t._id, name: t.name }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
