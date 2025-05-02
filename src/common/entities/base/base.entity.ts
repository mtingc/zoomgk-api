import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BaseDocument = Base & Document;

@Schema({ timestamps: true })
export class Base {
    @Prop()
    available: boolean;

    @Prop()
    createdAt?: Date;

    @Prop()
    updatedAt?: Date;
}