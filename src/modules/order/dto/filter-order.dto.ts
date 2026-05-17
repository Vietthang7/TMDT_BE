import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsEnum } from "class-validator";
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { OrderStatus } from '../../../common/enums';

export class FilterOrderDto extends PaginationDto {
    @ApiPropertyOptional({
        enum: OrderStatus,
        example: OrderStatus.PENDING,
    })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;
}
