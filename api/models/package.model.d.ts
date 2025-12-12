import { Document } from 'mongoose';
export type PackageDocument = Package & Document;
export declare class Package {
    name: string;
    price: number;
    description: string;
    features: string[];
    active: boolean;
}
export declare const PackageSchema: import("mongoose").Schema<Package, import("mongoose").Model<Package, any, any, any, Document<unknown, any, Package> & Omit<Package & {
    _id: import("mongoose").Types.ObjectId;
}, never>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Package, Document<unknown, {}, import("mongoose").FlatRecord<Package>> & Omit<import("mongoose").FlatRecord<Package> & {
    _id: import("mongoose").Types.ObjectId;
}, never>>;
//# sourceMappingURL=package.model.d.ts.map