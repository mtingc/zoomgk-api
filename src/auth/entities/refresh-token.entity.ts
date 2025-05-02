import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ collection: 'refresh_tokens' })
export class RefreshToken {
  @Prop({ required: true, ref: 'User', type: Types.ObjectId })
  userID: string;

  @Prop({ required: true })
  token: string;
  
  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);