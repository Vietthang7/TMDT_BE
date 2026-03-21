import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookPaymentDto {
  @ApiProperty({ description: 'Transaction code (in payment description)' })
  @IsNotEmpty()
  @IsString()
  transactionCode: string;

  @ApiProperty({ description: 'Amount transferred' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Bank transaction reference number' })
  @IsOptional()
  @IsString()
  bankTransactionId?: string;

  @ApiPropertyOptional({ description: 'Transaction description from bank' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Webhook secret for verification' })
  @IsOptional()
  @IsString()
  secret?: string;
}
