import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '@users/entities';
import { CreateUserDto, UpdateUserDto } from '@users/dto';
import { ResponseService } from '@common/services';

import { HashService } from '@auth/services';
import { RolesService } from '@roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly hashService: HashService,
    private readonly rolesService: RolesService,
    private readonly responseService: ResponseService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      /* const existRole = await this.rolesService.findOne(createUserDto.roleID);
      if (!existRole) {
        return this.responseService.response(null, 'Role not found', "NOT_FOUND");
      } */

      const userExistsByEmail = await this.findByIdentifier('email', createUserDto.email);
      if (userExistsByEmail) {
        return this.responseService.response(null, 'User already exists', "ALREADY_EXISTS");
      }

      const user = {
        ...createUserDto,
        password: await this.hashService.hashPassword(createUserDto.password),
        // roleID: existRole._id,
      }

      const createdUser = new this.userModel(user);

      await createdUser.save();

      return this.responseService.response(createdUser, 'User created successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async findAll() {
    try {
      const users = await this.userModel.find().exec();

      return this.responseService.response(users, 'Users fetched successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.findByIdentifier('_id', id);
      if (!user) {
        return this.responseService.response(null, 'User not found', "NOT_FOUND");
      }

      return this.responseService.response(user, 'User fetched successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findByIdentifier('_id', id);
      if (!user) {
        return this.responseService.response(null, 'User not found', "NOT_FOUND");
      }

      if (updateUserDto.roleID) {
        const existRole = await this.rolesService.findOne(updateUserDto.roleID);
        if (!existRole) {
          return this.responseService.response(null, 'Role not found', "NOT_FOUND");
        }
        updateUserDto.roleID = existRole._id as string;
      }

      delete updateUserDto.password;

      const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });

      return this.responseService.response(updatedUser, 'User updated successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async updatePassword(id: string, password: string) {
    try {
      const {
        data: user,
      } = await this.findByIdentifier('_id', id);
      if (!user) {
        return this.responseService.response(null, 'User not found', "NOT_FOUND");
      }

      const {
        data: hashedPassword,
        code: hashedPasswordCode,
      } = await this.hashService.hashPassword(password);
      if (hashedPasswordCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al actualizar la contraseña", "UPDATED_FAILED");
      }
      const updatedUser = await this.userModel.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });

      return this.responseService.response(updatedUser, 'User updated successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async updateAvailable(id: string) {
    try {
      const {
        data: user,
      } = await this.findByIdentifier('_id', id);
      if (!user) {
        return this.responseService.response(null, 'User not found', "NOT_FOUND");
      }

      const available = !user.available;
      const updatedUser = await this.userModel.findByIdAndUpdate(id, { available }, { new: true });

      return this.responseService.response(updatedUser, 'User updated successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async remove(id: string) {
    try {
      const {
        data: user,
      } = await this.findByIdentifier('_id', id);
      if (!user) {
        return this.responseService.response(null, 'User not found', "NOT_FOUND");
      }
      await this.userModel.findByIdAndDelete(id).exec();

      return this.responseService.response(null, 'User deleted successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async findByIdentifier(identifier: '_id' | 'email', value: string) {
    try {
      const user = await this.userModel.findOne({ [identifier]: value }).lean();
      if (!user) {
        return this.responseService.response(null, 'User not found', "NOT_FOUND");
      }

      return this.responseService.response(user, 'User fetched successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }
}
