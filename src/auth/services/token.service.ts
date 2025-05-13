import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';

import { ResponseService } from '@common/services';
import { RefreshToken, RefreshTokenDocument } from '@auth/entities';

@Injectable()
export class TokenService {
  private readonly secret: string;
  private verifyTokenExpiresIn: number;
  private resetPassTokenExpiresIn: number;
  private authTokenExpiresIn: number;
  private refreshTokenExpiresIn: number;

  constructor(
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly responseService: ResponseService,
  ) {
    this.secret = this.configService.get<string>('app.jwt.secret');
    this.verifyTokenExpiresIn = this.parseExpiresInToMs(this.configService.get<string>('app.jwt.verifyTokenExpiresIn'));
    this.resetPassTokenExpiresIn = this.parseExpiresInToMs(this.configService.get<string>('app.jwt.resetPassTokenExpiresIn'));
    this.authTokenExpiresIn = this.parseExpiresInToMs(this.configService.get<string>('app.jwt.authTokenExpiresIn'));
    this.refreshTokenExpiresIn = this.parseExpiresInToMs(this.configService.get<string>('app.jwt.refreshTokenExpiresIn'));
  }

  private parseExpiresInToMs(expiresIn: string): number {
    const regex = /^(\d+)([smhd])$/;
    const match = expiresIn.match(regex);

    if (!match) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  async signToken(type: 'verify' | 'reset-pass' | 'auth' | 'refresh', payload: any) {
    try {
      let token: string;
      let expiresAt: Date | null = null;

      let expiresIn: number;
      switch (type) {
        case 'verify':
          expiresIn = this.verifyTokenExpiresIn;
          break;
        case 'reset-pass':
          expiresIn = this.resetPassTokenExpiresIn;
          break;
        case 'auth':
          expiresIn = this.authTokenExpiresIn;
          break;
        case 'refresh':
          expiresIn = this.refreshTokenExpiresIn;
          break;
      }
      expiresAt = new Date(Date.now() + expiresIn);
      token = this.jwtService.sign(payload, { expiresIn, secret: this.secret });

      await this.refreshTokenModel.create({
        userID: payload.id,
        token,
        expiresAt: expiresAt?.toISOString(),
        createdAt: new Date(),
      });

      return this.responseService.response({
        token,
        expiresAt: expiresAt?.getTime() || null,
      }, 'Token creado exitosamente', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async decodeToken(token: string) {
    try {
      const findToken = await this.refreshTokenModel.findOne({ token });
      if (!findToken) {
        return this.responseService.response(null, 'Token no encontrado', "TOKEN_INVALID");
      }

      if (findToken.expiresAt < new Date()) {
        return this.responseService.response(null, 'Token expirado', "TOKEN_EXPIRED");
      }

      const decodedToken = this.jwtService.decode(token);

      return this.responseService.response(decodedToken, 'Token decodificado exitosamente', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }

  async deleteToken(token: string) {
    try {
      const findToken = await this.refreshTokenModel.findOne({ token });
      if (!findToken) {
        return this.responseService.response(null, 'Token no encontrado', "TOKEN_INVALID");
      }

      const deletedToken = await this.refreshTokenModel.deleteOne({ token });

      return this.responseService.response(deletedToken, 'Token eliminado exitosamente', "SUCCESS");
    } catch (error) {
      return this.responseService.response(null, error.message, "ERROR");
    }
  }
}
