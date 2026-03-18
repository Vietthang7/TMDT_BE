import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  @ApiOperation({ summary: 'Add a product to wishlist' })
  @ApiResponse({ status: 201, description: 'Product added to wishlist.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  add(
    @Param('productId') productId: string,
    @Req() req,
  ) {
    return this.wishlistService.add(req.user.id, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a product from wishlist' })
  @ApiResponse({ status: 200, description: 'Product removed from wishlist.' })
  @ApiResponse({ status: 404, description: 'Product not found in wishlist.' })
  remove(
    @Param('productId') productId: string,
    @Req() req,
  ) {
    return this.wishlistService.remove(req.user.id, productId);
  }

  @Get()
  @ApiOperation({ summary: 'Get wishlist with pagination' })
  @ApiResponse({ status: 200, description: 'Success' })
  getList(
    @Req() req,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.wishlistService.getList(req.user.id, paginationDto);
  }
}