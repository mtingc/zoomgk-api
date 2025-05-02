import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  frontendUrl: process.env.FRONTEND_URL,
  port: process.env.PORT || 3000,
  saltRounds: process.env.SALT_ROUNDS,
  jwt: {
    secret: process.env.JWT_SECRET,
    authTokenExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
    recoveryTokenExpiresIn: '10m',
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
  },
})); 