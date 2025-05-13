import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from '@users/entities';
import { CreateUserDto, UpdateUserDto } from '@users/dto';

import { ResponseService, PaginationService, MailService } from '@common/services';
import { SortField, SortOrder } from '@common/types';

import { HashService, TokenService } from '@auth/services';

import { RolesService } from '@roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly hashService: HashService,
    private readonly mailService: MailService,
    private readonly paginationService: PaginationService,
    private readonly responseService: ResponseService,
    private readonly rolesService: RolesService,
    private readonly tokenService: TokenService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const {
        data: roleID,
        code: roleIDCode,
      } = await this.rolesService.findOne(createUserDto.roleID);
      if (roleIDCode !== "SUCCESS") {
        return this.responseService.response(null, 'Role not found', "NOT_FOUND");
      }

      const {
        code: userExistsByEmailCode,
      } = await this.findByIdentifier('email', createUserDto.email);
      if (userExistsByEmailCode !== "NOT_FOUND") {
        return this.responseService.response(null, 'User already exists', "ALREADY_EXISTS");
      }

      const {
        data: password,
        code: passwordCode,
      } = await this.hashService.hashPassword(createUserDto.password);
      if (passwordCode !== "SUCCESS") {
        return this.responseService.response(null, "Error creating user", "ERROR");
      }

      const user: User = {
        ...createUserDto,
        password,
        roleID: roleID._id,
        available: true,
        folderID: new Types.ObjectId('6821476e4ea7469d2de4e345'), // TODO: Add folderID
        assetAvatarID: new Types.ObjectId('6821476e4ea7469d2de4e345'), // TODO: Add assetAvatarID,
        isVerified: false,
      }

      const {
        _id: createdUserID,
      } = await new this.userModel(user).save();

      const payload = {
        id: createdUserID,
      };

      const {
        data: validationToken,
        code: validationTokenCode,
      } = await this.tokenService.signToken('verify', payload);
      if (validationTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error creating validation token", "ERROR");
      }

      const createdUser = await this.userModel.findByIdAndUpdate(createdUserID, { validationToken: validationToken.token }, { new: true });

      await this.mailService.sendEmailTemplateAuth({
        to: createdUser.email,
        dynamicTemplateData: {
          subject: "Verificación de correo electrónico",
          preheader: "Confirma tu correo en ZoomGK y accede a tu contenido visual exclusivo",
          body: {
            title: "Verifica tu correo electrónico",
            subtitle: "Confirma tu dirección de correo para comenzar a disfrutar de GRAFIK PLAY",
            text1: "Haz clic en el botón a continuación para verificar tu correo electrónico de",
            textAction: "GRAFIK PLAY",
            textActionURL: "/auth/login",
            text2: ", una vez verificado, podrás acceder a todo tu contenido.",
            button: {
              text: "Verificar correo electrónico",
              url: `/auth/verify-account?token=${validationToken.token}`
            }
          }
        }
      });

      return this.responseService.response(createdUser, 'User created successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async findAll(sort: SortField, order: SortOrder, limit: number, page: number, search: string, available?: boolean) {
    try {
      const { items: users, pagination } = await this.paginationService.paginate(
        this.userModel,
        {},
        {
          sort,
          order,
          limit,
          page,
          search,
          searchFields: ['name', 'email'],
          available,
        }
      );

      return this.responseService.response({
        users,
        pagination,
      }, 'Users fetched successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async findOne(id: string) {
    try {
      const {
        data: user,
        code: userCode,
      } = await this.findByIdentifier('_id', id);
      if (userCode !== "SUCCESS") {
        return this.responseService.response(null, 'User not found', "NOT_FOUND");
      }

      return this.responseService.response(user, 'User fetched successfully', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const {
        code: userCode,
      } = await this.findByIdentifier('_id', id);
      if (userCode !== "SUCCESS") {
        return this.responseService.response(null, 'User not found', "NOT_FOUND");
      }

      if (updateUserDto.roleID) {
        const {
          data: existRole,
          code: existRoleCode,
        } = await this.rolesService.findOne(updateUserDto.roleID);
        if (existRoleCode !== "SUCCESS") {
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
        return this.responseService.response(null, "Error updating password", "UPDATED_FAILED");
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

  async updateVerifyAccount(id: string) {
    try {
      const {
        data: user,
      } = await this.findByIdentifier('_id', id);
      if (!user) {
        return this.responseService.response(null, 'User not found', "NOT_FOUND");
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        {
          $set: { isVerified: true },
          $unset: { validationToken: "" }
        },
        { new: true }
      );

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
