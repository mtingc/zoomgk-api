import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base, BaseDocument } from '@common/entities';

import { ERolePermission } from '@roles/entities';

export type RoleDocument = Role & BaseDocument;

@Schema({ timestamps: true })
export class Role extends Base {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: [String], enum: ERolePermission, default: [] })
    permissions: ERolePermission[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);