import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SePayWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Nội dung chuyển khoản' })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transferType?: string;

  @ApiProperty({ description: 'Số tiền giao dịch' })
  @IsNotEmpty()
  @IsNumber()
  transferAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  accumulated?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceCode?: string;
}
