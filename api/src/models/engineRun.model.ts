import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EngineRunDocument = EngineRun & Document;

@Schema({ timestamps: true })
export class EngineRun {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: string;

  @Prop({ required: true })
  engineType!: string; // e.g., 'strategy', 'copy', etc.

  @Prop({ type: Object, required: true })
  input!: Record<string, any>;

  @Prop({ type: Object, required: true })
  output!: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'Subscription', required: false })
  subscriptionId?: string;

  @Prop({ required: false })
  status?: string;
}

export const EngineRunSchema = SchemaFactory.createForClass(EngineRun);
