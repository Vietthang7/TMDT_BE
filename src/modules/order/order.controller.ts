import {
  Controller,
  Get,
  Post,
  Patch,
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
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout: create order from cart items' })
  @ApiResponse({ status: 201, description: 'Order created.' })
  @ApiResponse({ status: 400, description: 'Cart is empty or insufficient stock.' })
  checkout(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.orderService.checkout(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all orders for the current user' })
  @ApiResponse({ status: 200, description: 'List of user orders.' })
  getMyOrders(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.orderService.findAllByUser(user.id, pagination);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_WORKER)
  @ApiOperation({ summary: 'Get all orders (Admin / Warehouse)' })
  @ApiResponse({ status: 200, description: 'List of all orders.' })
  findAll(@Query() pagination: PaginationDto) {
    return this.orderService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order found.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_WORKER)
  @ApiOperation({ summary: 'Update order status (Admin / Warehouse)' })
  @ApiResponse({ status: 200, description: 'Order status updated.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, dto);
  }
}
