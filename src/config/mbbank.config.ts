import { registerAs } from '@nestjs/config';

export default registerAs('mbbank', () => ({
  username: process.env.MB_USERNAME,
  password: process.env.MB_PASSWORD,
  accountNo: process.env.MB_ACCOUNT_NO,
  accountName: process.env.MB_ACCOUNT_NAME || '',
  bankCode: process.env.MB_CODE || '970422',
}));
