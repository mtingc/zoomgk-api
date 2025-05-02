import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '@users/entities';
import { UsersController } from '@users/users.controller';
import { UsersService } from '@users/users.service';

import { CommonModule } from '@common/common.module';
import { AuthModule } from '@auth/auth.module';
import { RolesModule } from '@roles/roles.module';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
    RolesModule,
  ],
  exports: [MongooseModule, UsersService],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
