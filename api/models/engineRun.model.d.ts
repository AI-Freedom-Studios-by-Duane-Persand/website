import { Document, Types } from 'mongoose';
export type EngineRunDocument = EngineRun & Document;
export declare class EngineRun {
    userId: string;
    engineType: string;
    input: Record<string, any>;
    output: Record<string, any>;
    subscriptionId?: string;
    status?: string;
}
export declare const EngineRunSchema: import("mongoose").Schema<EngineRun, import("mongoose").Model<EngineRun, any, any, any, Document<unknown, any, EngineRun> & Omit<EngineRun & {
    _id: Types.ObjectId;
}, never>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EngineRun, Document<unknown, {}, import("mongoose").FlatRecord<EngineRun>> & Omit<import("mongoose").FlatRecord<EngineRun> & {
    _id: Types.ObjectId;
}, never>>;
//# sourceMappingURL=engineRun.model.d.ts.map