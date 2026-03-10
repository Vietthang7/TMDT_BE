import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Whey Protein Isolate 2kg' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Premium whey protein isolate for muscle recovery.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    example: ['uuid-of-category-1', 'uuid-of-category-2'],
    description: 'Array of category UUIDs to assign to this product',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds: string[];

  @ApiPropertyOptional({ example: ['protein', 'whey', 'muscle'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: ['https://res.cloudinary.com/xxx/image/upload/v1/products/abc.jpg'],
    description: 'Array of image URLs (uploaded via /api/upload first)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
