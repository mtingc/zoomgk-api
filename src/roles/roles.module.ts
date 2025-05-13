import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Role, RoleSchema } from '@roles/entities';
import { RolesController } from '@roles/roles.controller';
import { RolesService } from '@roles/roles.service';

import { CommonModule } from '@common/common.module';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])
  ],
  exports: [MongooseModule, RolesService],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule { }
