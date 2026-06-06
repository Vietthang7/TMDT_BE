import { IsString, IsEmail, IsOptional, IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GuestOrderItemDto {
  @ApiProperty({ example: 'uuid-product-id' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class GuestCheckoutDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  guestName: string;

  @ApiProperty({ example: 'guest@email.com' })
  @IsEmail()
  guestEmail: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  guestPhone: string;

  @ApiProperty({ example: '123 Nguyễn Trãi, Quận 1, TP.HCM' })
  @IsString()
  guestShippingAddress: string;

  @ApiProperty({ type: [GuestOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestOrderItemDto)
  items: GuestOrderItemDto[];

  @ApiPropertyOptional({ example: 'SUMMER2024' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Giao giờ hành chính' })
  @IsOptional()
  @IsString()
  notes?: string;
}