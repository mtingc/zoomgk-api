import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base, BaseDocument } from '@common/entities';

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

  @Prop({ required: true })
  roleID: string;

  @Prop({ required: true })
  folderID: string;

  @Prop({ required: true })
  assetAvatarID: string;
}

export const UserSchema = SchemaFactory.createForClass(User);