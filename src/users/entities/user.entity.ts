import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base, BaseDocument } from '@common/entities';
import { Types } from 'mongoose';

import { EUserGender } from '@users/entities';

export type UserDocument = User & BaseDocument;

@Schema({ timestamps: true })
export class User extends Base {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, enum: EUserGender })
  gender: EUserGender;

  @Prop({ required: true })
  birthDate: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: false })
  validationToken?: string;

  @Prop({ required: false, default: false })
  isVerified?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleID: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Folder', required: true })
  folderID: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  assetAvatarID: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);