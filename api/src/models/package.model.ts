import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PackageDocument = Package & Document;

@Schema({ timestamps: true })
export class Package {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: false, default: '' })
  description!: string;

  @Prop({ type: [String], default: [] })
  features!: string[];

  @Prop({ default: true })
  active!: boolean;
}

export const PackageSchema = SchemaFactory.createForClass(Package);
