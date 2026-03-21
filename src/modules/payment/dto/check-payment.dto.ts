import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckPaymentDto {
  @ApiProperty({ description: 'Transaction code to check' })
  @IsNotEmpty()
  @IsString()
  transactionCode: string;
}
