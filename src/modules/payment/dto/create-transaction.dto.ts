import { IsNotEmpty, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../../common/enums';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Order ID to create payment for' })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    default: PaymentMethod.BANK_TRANSFER,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
