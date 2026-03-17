import { ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsOptional,
    IsString,
    IsNumber,
    IsEnum,
    Min,
} from "class-validator";
import {Type} from "class-transformer";
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum ProductSortBy{
    PRICE_ASC = 'price_asc',
    PRICE_DESC = 'price_desc',
    NEWEST = 'newest',
}

export class FilterProductDto extends PaginationDto {
    @ApiPropertyOptional({ example: 'whey protein'})
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ example: 999999999 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        enum: ProductSortBy,
        example: ProductSortBy.NEWEST,
    })
    @IsOptional()
    @IsEnum(ProductSortBy)
    sortBy?: ProductSortBy;
}