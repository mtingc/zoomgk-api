import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import { User, UserDocument } from '@users/entities';
import { CreateUserDto, UpdateUserDto } from '@users/dto';

import { ResponseService, PaginationService, MailService } from '@common/services';
import { SortField, SortOrder } from '@common/types';

import { HashService, TokenService } from '@auth/services';

import { RolesService } from '@roles/roles.service';

@Injectable()
export class UsersService {
  private readonly frontendUrl = this.configService.get<string>('app.frontendUrl');
  private readonly authTemplateId = this.configService.get<string>('app.sendgrid.templates.auth');

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
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

      const buttonLink = `${this.frontendUrl}/auth/verify-account?token=${validationToken.token}`;
      await this.mailService.sendTemplateEmail({
        to: createdUser.email,
        templateId: this.authTemplateId,
        dynamicTemplateData: {
          "subject": "Verificación de correo electrónico",
          "preheader": "Verifica tu correo electrónico en ZoomGK para acceder a tu contenido visual",
          "head": {
            "logo": {
              "src": "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/Logo/imagotipo.png",
              "href": "http://zoomgk.com.mx",
              "alt": "Logo ZoomGrafiK"
            }
          },
          "body": {
            "title": "Verificación de correo electrónico",
            "subtitle": "Verifica tu correo electrónico en ZoomGK para acceder a tu contenido visual",
            "text1": "Haz click en el siguiente botón para verificar tu correo electrónico",
            "textAction": "GRAFIK PLAY",
            "textActionURL": "http://zoomgk.com.mx",
            "text2": ", haz click en el siguiente botón",
            "button": {
              "text": "Verificar correo electrónico",
              "url": buttonLink
            }
          },
          "footer": {
            "logo": {
              "src": "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/Logo/logotipo_negativo.png",
              "href": "http://zoomgk.com.mx",
              "alt": "Logo ZoomGrafiK"
            },
            "app": {
              "ios": {
                "src": "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/icons/badge/badge_ios.png",
                "href": "http://zoomgk.com.mx/app/download_ios",
                "alt": "Descarga App Store"
              },
              "android": {
                "src": "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/icons/badge/badge_android.png",
                "href": "http://zoomgk.com.mx/app/download_android",
                "alt": "Descarga en Google Play"
              }
            },
            "contactURL": "http://zoomgk.com.mx/contact",
            "faqsURL": "http://zoomgk.com.mx/faq",
            "privacy_policyURL": "http://zoomgk.com.mx/privacy-policy"
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
