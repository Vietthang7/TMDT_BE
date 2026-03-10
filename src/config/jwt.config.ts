import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'CHANGE_ME_TO_A_STRONG_RANDOM_SECRET',
  expiresIn: process.env.JWT_EXPIRATION || '3600s',
}));
