import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateAddressesDto {
    @ApiProperty({ example: '123 Trần Phú' })
    @IsString()
    @IsNotEmpty()
    street: string;

    @ApiProperty({ example: 'Hà Đông' })
    @IsString()
    @IsNotEmpty()
    state: string;

    @ApiProperty({ example: 'Hà Nội' })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    isDefault: boolean;
}