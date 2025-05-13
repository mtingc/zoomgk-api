import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LoginAuthDto, SignupAuthDto, RecoveryPassDto, ResetPassDto, AuthTokenDto, RefreshTokenDto } from '@auth/dto';
import { TokenService, HashService } from '@auth/services';

import { ResponseService, MailService } from '@common/services';

import { CreateUserDto } from '@users/dto';
import { UsersService } from '@users/users.service';

@Injectable()
export class AuthService {
  private readonly frontendUrl = this.configService.get<string>('app.frontendUrl');
  private readonly authTemplateId = this.configService.get<string>('app.sendgrid.templates.auth');

  constructor(
    private readonly configService: ConfigService,
    private readonly hashService: HashService,
    private readonly mailService: MailService,
    private readonly responseService: ResponseService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) { }

  async login(loginAuthDto: LoginAuthDto) {
    const invalidCredentialsMessage = 'Invalid credentials, try again';
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
        return this.responseService.response(null, "Error creating access token", "ERROR");
      }

      const {
        data: refreshToken,
        code: refreshTokenCode,
      } = await this.tokenService.signToken('refresh', payload);
      if (refreshTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error creating refresh token", "ERROR");
      }

      return this.responseService.response(
        {
          user,
          authToken,
          refreshToken,
        },
        'Login successful',
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
        return this.responseService.response(null, "Error creating user", "ERROR");
      }

      return this.responseService.response(
        user,
        'User created successfully',
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
        buttonLink = `${this.frontendUrl}/auth/login`;

        await this.mailService.sendTemplateEmail({
          to: recoveryPassDto.email,
          templateId: this.authTemplateId,
          dynamicTemplateData: {
            "subject": "Solicitud de acceso a ZOOM GRAFIK",
            "preheader": "Solicita acceso a ZOOM GRAFIK para acceder a tu contenido visual",
            "head": {
              "logo": {
                "src": "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/Logo/imagotipo.png",
                "href": "http://zoomgk.com.mx",
                "alt": "Logo ZoomGrafiK"
              }
            },
            "body": {
              "title": "No cuentas con acceso a ZOOM GRAFIK",
              //"subtitle": "",
              "text1": "Para acceder al contenido, solicita acceso a",
              "textAction": "GRAFIK PLAY",
              "textActionURL": "http://zoomgk.com.mx",
              //"text2": "",
              "button": {
                "text": "Solicitar acceso",
                "url": "http://zoomgk.com.mx/contact"
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
        return this.responseService.response(null, "The email is not registered", "INVALID_CREDENTIALS");
      }

      const payload = {
        id: userByEmail._id,
      };

      const {
        data: resetPassToken,
        code: resetPassTokenCode,
      } = await this.tokenService.signToken('reset-pass', payload);
      if (resetPassTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error creating reset password token", "ERROR");
      }

      buttonLink = `${this.frontendUrl}/auth/reset-pass?token=${resetPassToken.token}`;
      await this.mailService.sendTemplateEmail({
        to: userByEmail.email,
        templateId: this.authTemplateId,
        dynamicTemplateData: {
          "subject": "Recuperación de contraseña",
          "preheader": "Recupera tu contraseña en ZoomGK para acceder a tu contenido visual",
          "head": {
            "logo": {
              "src": "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/Logo/imagotipo.png",
              "href": "http://zoomgk.com.mx",
              "alt": "Logo ZoomGrafiK"
            }
          },
          "body": {
            "title": "Recuperación de contraseña",
            //"subtitle": "",
            "text1": "Recupera tu contraseña para acceder a tu contenido de",
            "textAction": "GRAFIK PLAY",
            "textActionURL": "http://zoomgk.com.mx",
            "text2": ", haz click en el siguiente botón",
            "button": {
              "text": "Recuperar contraseña",
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

      return this.responseService.response(
        {
          resetPassToken,
        },
        'Reset password token sent to email successfully',
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
        return this.responseService.response(null, "Token expired", "TOKEN_EXPIRED");
      }
      if (decodedTokenCode === "TOKEN_INVALID") {
        return this.responseService.response(null, "Invalid token", "TOKEN_INVALID");
      }

      const {
        data: userByID,
        code: userByIDCode,
      } = await this.usersService.findByIdentifier('_id', decodedToken.id);
      if (userByIDCode !== "SUCCESS") {
        return this.responseService.response(null, "Error finding user", "NOT_FOUND");
      }

      const {
        code: updateUserCode,
      } = await this.usersService.updatePassword(userByID._id, password);
      if (updateUserCode !== "SUCCESS") {
        return this.responseService.response(null, "Error updating password", "UPDATED_FAILED");
      }

      await this.mailService.sendTemplateEmail({
        to: userByID.email,
        templateId: this.authTemplateId,
        dynamicTemplateData: {
          "subject": "Contraseña actualizada",
          "preheader": "Contraseña actualizada en ZoomGK para acceder a tu contenido visual",
          "head": {
            "logo": {
              "src": "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/Logo/imagotipo.png",
              "href": "http://zoomgk.com.mx",
              "alt": "Logo ZoomGrafiK"
            }
          },
          "body": {
            "title": "Tu contraseña ha sido actualizada",
            // "subtitle": "",
            "text1": "Haz click en el siguiente enlace para acceder a tu contenido",
            "textAction": "GRAFIK PLAY",
            "textActionURL": "http://zoomgk.com.mx",
            "text2": ", haz click en el siguiente botón",
            "button": {
              "text": "Acceder a mi contenido",
              "url": "http://zoomgk.com.mx/auth/login"
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

      await this.tokenService.deleteToken(token);

      return this.responseService.response(
        null,
        "Password updated successfully",
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
        return this.responseService.response(null, "Token expired", "TOKEN_EXPIRED");
      }
      if (decodedTokenCode === "TOKEN_INVALID") {
        return this.responseService.response(null, "Invalid token", "TOKEN_INVALID");
      }

      return this.responseService.response(decodedToken, "Valid token", "SUCCESS");
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
        return this.responseService.response(null, "Error decoding refresh token", "ERROR");
      }

      const {
        data: userByID,
        code: userByIDCode,
      } = await this.usersService.findByIdentifier('_id', decodedToken.id);
      if (userByIDCode !== "SUCCESS") {
        return this.responseService.response(null, "Error finding user", "ERROR");
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
        return this.responseService.response(null, "Error creating access token", "ERROR");
      }

      return this.responseService.response(
        {
          user,
          authToken,
          refreshToken,
        },
        'Auth token updated successfully',
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

  async verifyAccount(token: string) {
    try {
      const {
        data: decodedToken,
        code: decodedTokenCode,
      } = await this.tokenService.decodeToken(token);
      if (decodedTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error decoding verification token", "ALREADY_VERIFIED");
      }

      const {
        data: userByID,
        code: userByIDCode,
      } = await this.usersService.findByIdentifier('_id', decodedToken.id);
      if (userByIDCode !== "SUCCESS") {
        return this.responseService.response(null, "Error finding user", "ALREADY_VERIFIED");
      }

      if (userByID.isVerified) {
        return this.responseService.response(null, "Account already verified", "ALREADY_VERIFIED");
      }

      const {
        code: deleteTokenCode,
      } = await this.tokenService.deleteToken(token);
      if (deleteTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error deleting verification token", "ERROR");
      }

      const {
        code: updateVerifyCode,
      } = await this.usersService.updateVerifyAccount(userByID._id);
      if (updateVerifyCode !== "SUCCESS") {
        return this.responseService.response(null, "Error updating user", "ERROR");
      }

      await this.mailService.sendTemplateEmail({
        to: userByID.email,
        templateId: this.authTemplateId,
        dynamicTemplateData: {
          "subject": "Cuenta verificada",
          "preheader": "Cuenta verificada en ZoomGK para acceder a tu contenido visual",
          "head": {
            "logo": {
              "src": "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/Logo/imagotipo.png",
              "href": "http://zoomgk.com.mx",
              "alt": "Logo ZoomGrafiK"
            }
          },
          "body": {
            "title": "Tu cuenta ha sido verificada",
            // "subtitle": "",
            "text1": "Haz click en el siguiente enlace para acceder a tu contenido",
            "textAction": "GRAFIK PLAY",
            "textActionURL": "http://zoomgk.com.mx",
            "text2": ", haz click en el siguiente botón",
            "button": {
              "text": "Acceder a mi contenido",
              "url": "http://zoomgk.com.mx/auth/login"
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

      return this.responseService.response(null, "Account verified successfully", "SUCCESS");
    } catch (error) {
      throw new BadRequestException(
        this.responseService.response(null, error.message, "ERROR"));
    }
  }

  async logout({ refreshToken }: RefreshTokenDto) {
    try {
      const {
        code: deleteTokenCode,
      } = await this.tokenService.deleteToken(refreshToken);
      if (deleteTokenCode !== "SUCCESS") {
        return this.responseService.response(null, "Error deleting refresh token", "ERROR");
      }

      return this.responseService.response(
        null,
        'Session closed successfully',
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
