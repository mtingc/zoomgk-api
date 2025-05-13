import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateRoleDto, UpdateRoleDto } from '@roles/dto';
import { Role, RoleDocument } from '@roles/entities';

import { ResponseService, PaginationService } from '@common/services';
import { SortField, SortOrder } from '@common/types';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private readonly responseService: ResponseService,
    private readonly paginationService: PaginationService,
  ) { }

  async create(createRoleDto: CreateRoleDto) {
    try {
      const {
        code: roleExistsByNameCode,
      } = await this.findByIdentifier('name', createRoleDto.name);
      if (roleExistsByNameCode !== "NOT_FOUND") {
        return this.responseService.response(null, 'Role already exists', "ALREADY_EXISTS");
      }

      const role: Role = {
        ...createRoleDto,
        available: true,
      };

      const createdRole = new this.roleModel(role);

      await createdRole.save();

      return this.responseService.response(createdRole, 'Role created successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async findAll(sort: SortField, order: SortOrder, limit: number, page: number, search: string, available?: boolean) {
    try {
      const { items: roles, pagination } = await this.paginationService.paginate(
        this.roleModel,
        {},
        {
          sort,
          order,
          limit,
          page,
          search,
          searchFields: ['name'],
          available,
        }
      );

      return this.responseService.response({
        roles,
        pagination,
      }, 'Roles fetched successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async findOne(id: string) {
    try {
      const {
        data: role,
        code: roleCode,
      } = await this.findByIdentifier('_id', id);
      if (roleCode !== "SUCCESS") {
        return this.responseService.response(null, 'Role not found', "NOT_FOUND");
      }
      return this.responseService.response(role, 'Role fetched successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    try {
      const {
        code: roleCode,
      } = await this.findByIdentifier('_id', id);
      if (roleCode !== "SUCCESS") {
        return this.responseService.response(null, 'Role not found', "NOT_FOUND");
      }

      const updatedRole = await this.roleModel.findByIdAndUpdate(id, updateRoleDto, { new: true });

      return this.responseService.response(updatedRole, 'Role updated successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async updateAvailable(id: string) {
    try {
      const {
        data: role,
      } = await this.findByIdentifier('_id', id);
      if (!role) {
        return this.responseService.response(null, 'Role not found', "NOT_FOUND");
      }

      const available = !role.available;
      const updatedRole = await this.roleModel.findByIdAndUpdate(id, { available }, { new: true });

      return this.responseService.response(updatedRole, 'Role updated successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async remove(id: string) {
    try {
      const {
        data: role,
      } = await this.findByIdentifier('_id', id);
      if (!role) {
        return this.responseService.response(null, 'Role not found', "NOT_FOUND");
      }
      await this.roleModel.findByIdAndDelete(id).exec();

      return this.responseService.response(null, 'Role deleted successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async findByIdentifier(identifier: '_id' | 'name', value: string) {
    try {
      const query = identifier === 'name'
        ? { [identifier]: { $regex: new RegExp(`^${value}$`, 'i') } }
        : { [identifier]: value };

      const role = await this.roleModel.findOne(query).lean();
      if (!role) {
        return this.responseService.response(null, 'Role not found', "NOT_FOUND");
      }
      return this.responseService.response(role, 'Role fetched successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }
}
