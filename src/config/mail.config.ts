import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  email: process.env.SEND_MAIL_EMAIL,
  password: process.env.SEND_MAIL_PASSWORD,
}));
