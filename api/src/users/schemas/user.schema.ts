// api/src/users/schemas/user.schema.ts
import { Schema, Document, Types } from 'mongoose';

export interface UserDocument extends Document {
  tenantId: Types.ObjectId;
  email: string;
  passwordHash: string;
  roles: string[];
  isEarlyAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<UserDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: [], required: true },
  isEarlyAccess: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Global unique index on email (prevents same email across all tenants)
UserSchema.index({ email: 1 }, { unique: true });
// Composite index for email + tenant lookup optimization
UserSchema.index({ email: 1, tenantId: 1 });

// Do not export a compiled model here. Use MongooseModule.forFeature in modules.
