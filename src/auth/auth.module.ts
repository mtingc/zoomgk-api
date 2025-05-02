import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { CommonModule } from '@common/common.module';
import { UsersModule } from '@users/users.module';

import { RefreshToken, RefreshTokenSchema } from '@auth/entities';
import { AuthController } from '@auth/auth.controller';
import { AuthService } from '@auth/auth.service';
import { TokenService, HashService } from '@auth/services';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('app.jwt.secret'),
        signOptions: { expiresIn: configService.get('app.jwt.accessTokenExpiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule, AuthService, TokenService, HashService],
  controllers: [AuthController],
  providers: [AuthService, TokenService, HashService],
})
export class AuthModule { }
