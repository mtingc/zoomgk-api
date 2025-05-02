import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base, BaseDocument } from '@common/entities';

export type RoleDocument = Role & BaseDocument;

@Schema({ timestamps: true })
export class Role extends Base {
    @Prop({ required: true })
    name: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

