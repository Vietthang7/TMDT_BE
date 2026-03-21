import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateQRDto {
  @ApiProperty({ description: 'Amount to transfer' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  @Max(999999999999)
  amount: number;

  @ApiProperty({ description: 'Transfer description (will be sanitized)' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Bank ID (BIN or code), defaults to configured bank' })
  @IsOptional()
  @IsString()
  bankId?: string;

  @ApiPropertyOptional({ description: 'Account number, defaults to configured account' })
  @IsOptional()
  @IsString()
  accountNo?: string;

  @ApiPropertyOptional({ description: 'Account name' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({
    description: 'QR template',
    enum: ['compact2', 'compact', 'qr_only', 'print'],
    default: 'compact2'
  })
  @IsOptional()
  @IsString()
  template?: 'compact2' | 'compact' | 'qr_only' | 'print';
}
