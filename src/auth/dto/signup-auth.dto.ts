import { PartialType } from '@nestjs/mapped-types';

import { CreateUserDto } from '@users/dto';

export class SignupAuthDto extends PartialType(CreateUserDto) {}
