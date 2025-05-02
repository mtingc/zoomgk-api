import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LoginAuthDto, SignupAuthDto, RecoveryPassDto, ResetPassDto, AuthTokenDto, RefreshTokenDto } from '@auth/dto';
import { TokenService, HashService } from '@auth/services';
import { ResponseService } from '@common/services';
import { MailService } from '@common/services/mail.service';
import { CreateUserDto } from '@users/dto';
import { UsersService } from '@users/users.service';

@Injectable()
export class AuthService {
  private readonly frontendUrl = this.configService.get<string>('app.frontendUrl');
  private readonly recoveryTemplateId = "d-6bf0cbbbeec140f4b2ebabe05d93208d";

  constructor(
    private readonly tokenService: TokenService,
    private readonly hashService: HashService,
    private readonly usersService: UsersService,
    private readonly responseService: ResponseService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  async login(loginAuthDto: LoginAuthDto) {
    const invalidCredentialsMessage = 'Credenciales incorrectas, intente nuevamente';
    try {
      const {
        data: userByEmail,
        code: userByEmailCode,
      } = await this.usersService.findByIdentifier('email', loginAuthDto.email);
      if (userByEmailCode === "NOT_FOUND") {
        return this.responseService.response(null, invalidCredentialsMessage, "INVALID_CREDENTIALS");
      }

      const {
        code: isPasswordValidCode,
      } = await this.hashService.comparePassword(loginAuthDto.password, userByEmail.password);
      if (isPasswordValidCode === "INVALID_CREDENTIALS") {
        return this.responseService.response(null, invalidCredentialsMessage, "INVALID_CREDENTIALS");
      }

      const { password, ...user } = userByEmail;

      const payload = {
        id: userByEmail._id,
        email: userByEmail.email,
        role: userByEmail.roleID,
      };

      const {
        data: authToken,
        code: authTokenCode,
      } = await this.tokenService.signToken('auth', payload);
      if (authTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al crear el token de acceso", "ERROR");
      }

      const {
        data: refreshToken,
        code: refreshTokenCode,
      } = await this.tokenService.signToken('refresh', payload);
      if (refreshTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al crear el token de actualización", "ERROR");
      }

      return this.responseService.response(
        {
          user,
          authToken,
          refreshToken,
        },
        'Inicio de sesión exitoso',
        "SUCCESS"
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseService.response(
          null,
          error.message,
          "ERROR"
        )
      );
    }
  }

  async signup(signupAuthDto: SignupAuthDto) {
    try {
      const {
        data: user,
        code: userCode,
      } = await this.usersService.create(signupAuthDto as CreateUserDto);
      if (userCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al crear el usuario", "ERROR");
      }

      return this.responseService.response(
        user,
        'Usuario creado exitosamente',
        "SUCCESS"
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseService.response(
          null,
          error.message,
          "ERROR"
        )
      );
    }
  }

  async recoveryPass(recoveryPassDto: RecoveryPassDto) {
    try {
      let buttonLink = '';
      const {
        data: userByEmail,
        code: userByEmailCode,
      } = await this.usersService.findByIdentifier('email', recoveryPassDto.email);
      if (userByEmailCode !== "SUCCESS") {
        buttonLink = `${this.frontendUrl}/login`;

        await this.mailService.sendTemplateEmail({
          to: recoveryPassDto.email,
          templateId: this.recoveryTemplateId,
          dynamicTemplateData: {
            title: 'Inicio de sesión',
            description: 'Tu cuenta no está registrada en ZoomGK, por favor crea una cuenta para continuar.',
            button: {
              text: 'Crear cuenta',
              link: buttonLink,
            }
          },
        });
        return this.responseService.response(null, "El correo electrónico no está registrado", "INVALID_CREDENTIALS");
      }

      const payload = {
        id: userByEmail._id,
      };

      const {
        data: recoveryToken,
        code: recoveryTokenCode,
      } = await this.tokenService.signToken('recovery', payload);
      if (recoveryTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al crear el token de recuperación", "ERROR");
      }

      buttonLink = `${this.frontendUrl}#/reset-pass?token=${recoveryToken.token}`;
      await this.mailService.sendTemplateEmail({
        to: userByEmail.email,
        templateId: this.recoveryTemplateId,
        dynamicTemplateData: {
          title: 'Recuperación de contraseña',
          description: 'Haga click en el botón para recuperar su contraseña. Si no solicitó este cambio, ignore este correo.',
          button: {
            text: 'Recuperar contraseña',
            link: buttonLink,
          }
        },
      });

      return this.responseService.response(
        {
          recoveryToken,
        },
        'Token de recuperación enviado al correo exitosamente',
        "SUCCESS"
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseService.response(
          null,
          error.message,
          "ERROR"
        )
      );
    }
  }

  async resetPass({ password }: ResetPassDto, token: string) {
    try {
      const {
        data: decodedToken,
        code: decodedTokenCode,
      } = await this.tokenService.decodeToken(token);
      if (decodedTokenCode === "TOKEN_EXPIRED") {
        return this.responseService.response(null, "Token expirado", "TOKEN_EXPIRED");
      }
      if (decodedTokenCode === "TOKEN_INVALID") {
        return this.responseService.response(null, "Token inválido", "TOKEN_INVALID");
      }

      const {
        data: userByID,
        code: userByIDCode,
      } = await this.usersService.findByIdentifier('_id', decodedToken.id);
      if (userByIDCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al encontrar el usuario", "NOT_FOUND");
      }

      const {
        code: updateUserCode,
      } = await this.usersService.updatePassword(userByID._id, password);
      if (updateUserCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al actualizar la contraseña", "UPDATED_FAILED");
      }

      await this.mailService.sendTemplateEmail({
        to: userByID.email,
        templateId: this.recoveryTemplateId,
        dynamicTemplateData: {
          title: 'Contraseña actualizada',
          description: 'Tu contraseña ha sido actualizada exitosamente',
        },
      });

      await this.tokenService.deleteToken(token);

      return this.responseService.response(
        null,
        "Contraseña actualizada exitosamente",
        "SUCCESS"
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseService.response(
          null,
          error.message,
          "ERROR"
        )
      );
    }
  }

  async checkToken(token: string) {
    try {
      const {
        data: decodedToken,
        code: decodedTokenCode,
      } = await this.tokenService.decodeToken(token);
      if (decodedTokenCode === "TOKEN_EXPIRED") {
        await this.tokenService.deleteToken(token);
        return this.responseService.response(null, "Token expirado", "TOKEN_EXPIRED");
      }
      if (decodedTokenCode === "TOKEN_INVALID") {
        return this.responseService.response(null, "Token inválido", "TOKEN_INVALID");
      }

      return this.responseService.response(decodedToken, "Token válido", "SUCCESS");
    } catch (error) {
      throw new BadRequestException(
        this.responseService.response(
          null,
          error.message,
          "ERROR"
        )
      );
    }
  }

  async authToken({ refreshToken }: AuthTokenDto) {
    try {
      const {
        data: decodedToken,
        code: decodedTokenCode,
      } = await this.tokenService.decodeToken(refreshToken);
      if (decodedTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al decodificar el token de actualización", "ERROR");
      }

      const {
        data: userByID,
        code: userByIDCode,
      } = await this.usersService.findByIdentifier('_id', decodedToken.id);
      if (userByIDCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al encontrar el usuario", "ERROR");
      }

      const { password, ...user } = userByID;

      const payload = {
        id: userByID._id,
        email: userByID.email,
        role: userByID.roleID,
      };

      const {
        data: authToken,
        code: authTokenCode,
      } = await this.tokenService.signToken('auth', payload);
      if (authTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al crear el token de acceso", "ERROR");
      }

      return this.responseService.response(
        {
          user,
          authToken,
          refreshToken,
        },
        'Auth token actualizado exitosamente',
        "SUCCESS"
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseService.response(
          null,
          error.message,
          "ERROR"
        )
      );
    }
  }

  async logout({ refreshToken }: RefreshTokenDto) {
    try {
      const {
        code: deleteTokenCode,
      } = await this.tokenService.deleteToken(refreshToken);
      if (deleteTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error al eliminar el token de actualización", "ERROR");
      }

      return this.responseService.response(
        null,
        'Sesión cerrada exitosamente',
        "SUCCESS"
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseService.response(
          null,
          error.message,
          "ERROR"
        )
      );
    }
  }
}
