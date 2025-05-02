import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateRoleDto, UpdateRoleDto } from '@roles/dto';
import { Role, RoleDocument } from '@roles/entities';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) { }

  create(createRoleDto: CreateRoleDto) {
    return this.roleModel.create(createRoleDto);
  }

  findAll() {
    return this.roleModel.find().exec();
  }

  findOne(id: string) {
    return this.roleModel.findById(id).exec();
  }

  update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.roleModel.findByIdAndUpdate(id, updateRoleDto, { new: true }).exec();
  }

  remove(id: string) {
    return this.roleModel.findByIdAndDelete(id).exec();
  }
}
