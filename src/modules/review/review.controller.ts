import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto';
import { CurrentUser } from '../auth/decorators';
import { User } from '../user/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm đánh giá sản phẩm (phải đã mua, trong 48h)' })
  @ApiResponse({ status: 201, description: 'Review created.' })
  @ApiResponse({ status: 400, description: 'Chưa mua hoặc quá 48h.' })
  @ApiResponse({ status: 409, description: 'Đã đánh giá rồi.' })
  create(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(user.id, dto);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Xem danh sách đánh giá của sản phẩm' })
  @ApiResponse({ status: 200, description: 'List reviews.' })
  getByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviewService.getByProduct(productId, pagination);
  }
}
