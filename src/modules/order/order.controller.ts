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
import { CreateOrderDto, UpdateOrderStatusDto, FilterOrderDto } from './dto';
import { CreateOrderAdminDto } from './dto/create-order-admin.dto';
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

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_WORKER)
  @ApiOperation({ summary: 'Create an order directly (Admin/Warehouse)' })
  @ApiResponse({ status: 201, description: 'Order created.' })
  createByAdmin(@Body() dto: CreateOrderAdminDto, @CurrentUser() user: User) {
    return this.orderService.createByAdmin(dto, user.id);
  }

  private formatOrderAddress(order: any): any {
    if (!order) return order;
    let shippingAddress = order.shippingAddress;
    if (order.addressEntity) {
      const parts: string[] = [];
      if (order.addressEntity.street) parts.push(order.addressEntity.street);
      if (order.addressEntity.city) parts.push(order.addressEntity.city);
      if (order.addressEntity.state) parts.push(order.addressEntity.state);
      shippingAddress = parts.join(', ');
    }
    const { addressEntity, ...rest } = order;
    return { ...rest, shippingAddress };
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all orders for the current user' })
  @ApiResponse({ status: 200, description: 'List of user orders.' })
  async getMyOrders(@CurrentUser() user: User, @Query() query: FilterOrderDto) {
    const result = await this.orderService.findAllByUser(user.id, query);
    result.data = result.data.map((order) => this.formatOrderAddress(order));
    return result;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_WORKER)
  @ApiOperation({ summary: 'Get all orders (Admin / Warehouse)' })
  @ApiResponse({ status: 200, description: 'List of all orders.' })
  async findAll(@Query() query: FilterOrderDto) {
    const result = await this.orderService.findAll(query);
    result.data = result.data.map((order) => this.formatOrderAddress(order));
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order found.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.orderService.findById(id);
    return this.formatOrderAddress(order);
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
