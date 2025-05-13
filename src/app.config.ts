import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  frontendUrl: `${process.env.FRONTEND_URL}#`,
  port: process.env.PORT || 3000,
  saltRounds: process.env.SALT_ROUNDS,
  jwt: {
    secret: process.env.JWT_SECRET,
    verifyTokenExpiresIn: '7d',
    resetPassTokenExpiresIn: '10m',
    authTokenExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
    database: process.env.MONGODB_DATABASE,
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    templates: {
      auth: process.env.SENDGRID_AUTH_TEMPLATE_ID || 'd-6bf0cbbbeec140f4b2ebabe05d93208d',
    },
  },
})); 