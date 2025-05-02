import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ResponseInterceptor } from '@common/interceptors';
import { AllExceptionsFilter } from '@common/filters';
import { ResponseService } from '@common/services';
import { MailService } from '@common/services/mail.service';

@Module({
  imports: [ConfigModule],
  exports: [
    ResponseInterceptor,
    AllExceptionsFilter,
    ResponseService,
    MailService,
  ],
  providers: [
    ResponseInterceptor,
    AllExceptionsFilter,
    ResponseService,
    MailService,
  ],
})
export class CommonModule { }
