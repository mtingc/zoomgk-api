import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import appConfig from '@app/app.config';

import { CommonModule } from '@common/common.module';
import { ResponseInterceptor } from '@common/interceptors';
import { AllExceptionsFilter } from '@common/filters';
import { AuthModule } from '@auth/auth.module';
import { RolesModule } from '@roles/roles.module';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('app.mongodb.uri'),
        dbName: configService.get<string>('app.mongodb.database'),
        auth: {
          username: configService.get<string>('app.mongodb.user'),
          password: configService.get<string>('app.mongodb.password'),
        },
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    AuthModule,
    RolesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule { }
