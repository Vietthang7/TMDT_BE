import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  ApiQuery,
} from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  // ── Public: Validate coupon ─────────────────────────
  @Post('validate')
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiQuery({ name: 'orderAmount', required: false, type: Number, description: 'Order amount to check minimum requirement' })
  @ApiResponse({ status: 200, description: 'Coupon is valid.' })
  @ApiResponse({ status: 400, description: 'Coupon is invalid or expired.' })
  validateCoupon(
    @Body() dto: ValidateCouponDto,
    @Query('orderAmount') orderAmount?: number,
  ) {
    return this.couponService.validateCoupon(dto.code, Number(orderAmount) || 0);
  }

  // ── Admin: CRUD ─────────────────────────────────────
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a coupon (Admin)' })
  @ApiResponse({ status: 201, description: 'Coupon created.' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponService.create(dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all coupons (Admin)' })
  @ApiResponse({ status: 200, description: 'List of coupons.' })
  findAll(@Query() pagination: PaginationDto) {
    return this.couponService.findAll(pagination);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Coupon found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponService.findById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a coupon (Admin)' })
  @ApiResponse({ status: 200, description: 'Coupon updated.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a coupon (Admin)' })
  @ApiResponse({ status: 200, description: 'Coupon deactivated.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponService.remove(id);
  }
}
