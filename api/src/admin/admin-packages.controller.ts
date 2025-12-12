// ...imports remain at the top...
import { Controller, Get, Post, Body, Param, Patch, Delete, Put } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Package, PackageDocument } from '../models/package.model';

@Controller('admin/packages')
export class AdminPackagesController {
  constructor(
    @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
  ) {}

  @Get('ids-names')
  async getPackageIdsAndNames() {
    const pkgs = await this.packageModel.find({}, { _id: 1, name: 1 });
    return pkgs.map((p: any) => ({ id: p._id, name: p.name }));
  }

  @Get()
  async getAll() {
    return this.packageModel.find();
  }

  @Post()
  async create(@Body() dto: Partial<Package>) {
    return this.packageModel.create(dto);
  }


  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<Package>) {
    return this.packageModel.findByIdAndUpdate(id, dto, { new: true });
  }

  @Put(':id')
  async putUpdate(@Param('id') id: string, @Body() dto: Partial<Package>) {
    return this.packageModel.findByIdAndUpdate(id, dto, { new: true });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.packageModel.findByIdAndDelete(id);
  }
}
