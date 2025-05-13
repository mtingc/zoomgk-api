import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

interface CommonTemplateData {
  head: {
    logo: {
      src: string;
      href: string;
      alt: string;
    };
  };
  footer: {
    logo: {
      src: string;
      href: string;
      alt: string;
    };
    app: {
      ios: {
        src: string;
        href: string;
        alt: string;
      };
      android: {
        src: string;
        href: string;
        alt: string;
      };
    };
    contactURL: string;
    faqsURL: string;
    privacy_policyURL: string;
  };
}

interface AuthTemplateData {
  subject: string;
  preheader: string;
  body: {
    title: string;
    subtitle?: string;
    text1: string;
    textAction: string;
    textActionURL: string;
    text2?: string;
    button: {
      text: string;
      url: string;
    };
  }
}

interface SendTemplateEmailParams {
  to: string;
  dynamicTemplateData: AuthTemplateData;
}

@Injectable()
export class MailService {
  private readonly frontendUrl = this.configService.get<string>('app.frontendUrl');

  private readonly commonTemplateData: CommonTemplateData = {
    head: {
      logo: {
        src: "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/Logo/imagotipo.png",
        href: `${this.frontendUrl}`,
        alt: "Logo ZoomGrafiK"
      }
    },
    footer: {
      logo: {
        src: "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/Logo/logotipo_negativo.png",
        href: `${this.frontendUrl}`,
        alt: "Logo ZoomGrafiK"
      },
      app: {
        ios: {
          src: "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/icons/badge/badge_ios.png",
          href: `${this.frontendUrl}/app/download_ios`,
          alt: "Descarga App Store"
        },
        android: {
          src: "https://zoomgk-pullzone.b-cdn.net/Identidad_visual/icons/badge/badge_android.png",
          href: `${this.frontendUrl}/app/download_android`,
          alt: "Descarga en Google Play"
        }
      },
      contactURL: `${this.frontendUrl}/contact`,
      faqsURL: `${this.frontendUrl}/faq`,
      privacy_policyURL: `${this.frontendUrl}/privacy-policy`
    }
  };

  constructor(
    private readonly configService: ConfigService,
  ) {
    SendGrid.setApiKey(this.configService.get<string>('app.sendgrid.apiKey'));
  }

  async sendEmailTemplateAuth({
    to,
    dynamicTemplateData
  }: SendTemplateEmailParams) {
    const templateId = this.configService.get<string>(`app.sendgrid.templates.auth`);
    try {
      const completeTemplateData = {
        subject: dynamicTemplateData.subject,
        preheader: dynamicTemplateData.preheader,
        ...this.commonTemplateData,
        body: {
          ...dynamicTemplateData.body,
          textActionURL: `${this.frontendUrl}${dynamicTemplateData.body.textActionURL}`,
          button: {
            text: dynamicTemplateData.body.button.text,
            url: `${this.frontendUrl}${dynamicTemplateData.body.button.url}`
          }
        }
      };


      const mail = {
        to,
        from: this.configService.get<string>('app.sendgrid.fromEmail'),
        templateId,
        dynamicTemplateData: completeTemplateData,
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