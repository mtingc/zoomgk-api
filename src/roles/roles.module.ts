import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Role, RoleSchema } from '@roles/entities';
import { RolesController } from '@roles/roles.controller';
import { RolesService } from '@roles/roles.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])
  ],
  exports: [MongooseModule, RolesService],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
