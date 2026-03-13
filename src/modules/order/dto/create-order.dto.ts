import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: '123 Fitness St, Ho Chi Minh City' })
  @IsString()
  shippingAddress: string;

  @ApiPropertyOptional({ example: 'Leave at the front door' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'SUMMER2024', description: 'Mã giảm giá (nếu có)' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
