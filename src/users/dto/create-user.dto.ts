import { IsString, IsNotEmpty, IsEmail, IsEnum } from 'class-validator';

import { EUserGender } from '@users/entities';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(EUserGender)
  @IsNotEmpty()
  gender: EUserGender;

  @IsString()
  @IsNotEmpty()
  birthDate: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  roleID: string;
}
