import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../user/entities/user.entity';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { CouponService } from '../coupon/coupon.service';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  PaginatedResult,
  paginateRaw,
  buildPaginatedResult,
} from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
    private readonly couponService: CouponService,
    private readonly mailService: MailService,
  ) {}

  async checkout(userId: string, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const cartItem of cart.items) {
      const product = await this.productService.findById(cartItem.productId);

      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}"`,
        );
      }

      subtotal += Number(product.price) * cartItem.quantity;

      const orderItem = this.orderItemRepository.create({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        priceAtPurchase: product.price,
      });
      orderItems.push(orderItem);

      product.stock -= cartItem.quantity;
      await this.productService.update(product.id, { stock: product.stock });
    }

    // ── Apply coupon if provided ──────────────────────
    let discountAmount = 0;
    let couponId: string | undefined;
    let couponCode: string | undefined;

    if (dto.couponCode) {
      const coupon = await this.couponService.validateCoupon(dto.couponCode, subtotal);
      discountAmount = this.couponService.calculateDiscount(coupon, subtotal);
      couponId = coupon.id;
      couponCode = coupon.code;
      await this.couponService.incrementUsage(coupon.id);
    }

    const totalAmount = subtotal - discountAmount;

    const order = this.orderRepository.create({
      userId,
      shippingAddress: dto.shippingAddress,
      totalAmount,
      discountAmount,
      couponId,
      couponCode,
      items: orderItems,
    });

    const savedOrder = await this.orderRepository.save(order);
    await this.cartService.clearCart(userId);

    // ── Send order confirmation email ────────────────
    const fullOrder = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product', 'user'],
    });
    if (fullOrder?.user?.email) {
      this.mailService
        .sendOrderConfirmation(fullOrder.user.email, fullOrder)
        .catch((err) => this.logger.error(`Mail error: ${err.message}`));
    }

    return savedOrder;
  }

  async findAllByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Order>> {
    const { take, skip } = paginateRaw(pagination.page, pagination.limit);
    const [data, totalItems] = await this.orderRepository.findAndCount({
      where: { userId },
      relations: ['items', 'items.product', 'coupon'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return buildPaginatedResult(data, totalItems, pagination.page, pagination.limit);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Order>> {
    const { take, skip } = paginateRaw(pagination.page, pagination.limit);
    const [data, totalItems] = await this.orderRepository.findAndCount({
      relations: ['items', 'items.product', 'user', 'coupon'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return buildPaginatedResult(data, totalItems, pagination.page, pagination.limit);
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'coupon'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findById(id);
    order.status = dto.status;
    return this.orderRepository.save(order);
  }
}
