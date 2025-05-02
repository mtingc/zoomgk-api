import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

interface SendTemplateEmailParams {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
}

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
  ) {
    SendGrid.setApiKey(this.configService.get<string>('app.sendgrid.apiKey'));
  }

  async sendTemplateEmail({
    to,
    templateId,
    dynamicTemplateData
  }: SendTemplateEmailParams) {
    try {
      const mail = {
        to,
        from: this.configService.get<string>('app.sendgrid.fromEmail'),
        templateId,
        dynamicTemplateData,
      };

      await SendGrid.send(mail);
      return {
        data: true,
        message: 'Correo enviado exitosamente',
        code: 'SUCCESS'
      };
    } catch (error) {
      return {
        data: null,
        message: 'Error al enviar el correo',
        code: 'ERROR'
      };
    }
  }
} 