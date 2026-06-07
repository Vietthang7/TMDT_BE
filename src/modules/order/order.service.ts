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
import { CreateOrderDto, UpdateOrderStatusDto, FilterOrderDto } from './dto';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';
import { CreateOrderAdminDto } from './dto/create-order-admin.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AddressesService } from '../addresses/addresses.service';
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
    private readonly addressesService: AddressesService,
  ) {}

  private async generateOrderCode(): Promise<string> {
    const today = new Date();
    const dateString =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const countToday = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :todayStart', { todayStart })
      .andWhere('order.createdAt <= :todayEnd', { todayEnd })
      .getCount();

    const sequentialNumber = (countToday + 1).toString().padStart(4, '0');
    return `${dateString}-${sequentialNumber}`;
  }

  async createByAdmin(dto: CreateOrderAdminDto, adminId: string): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order items cannot be empty');
    }

    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const item of dto.items) {
      const product = await this.productService.findById(item.productId);

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}"`,
        );
      }

      subtotal += Number(product.price) * item.quantity;

      const orderItem = this.orderItemRepository.create({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });
      orderItems.push(orderItem);

      product.stock -= item.quantity;
      await this.productService.update(product.id, { stock: product.stock });
    }

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
    const orderCode = await this.generateOrderCode();

    const order = this.orderRepository.create({
      userId: dto.userId || adminId, // if no user specified, assign to the admin/warehouse creator
      orderCode,
      shippingAddress: dto.shippingAddress,
      totalAmount,
      discountAmount,
      couponId,
      couponCode,
      items: orderItems,
      // For Admin-created orders, it might be auto-confirmed or delivered depending on business logic,
      // but default PENDING is fine, they can update it after.
    });

    return await this.orderRepository.save(order);
  }

  async checkout(userId: string, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // ── Get address ──────────────────────
    let address;
    if (dto.shippingAddress) {
      address = await this.addressesService.findById(dto.shippingAddress, userId);
    } else {
      address = await this.addressesService.getDefault(userId);
    }

    if (!address) {
      throw new BadRequestException('No address found');
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

    // ── Generate Order Code ──────────────────────
    const orderCode = await this.generateOrderCode();

    const order = this.orderRepository.create({
      userId,
      orderCode,
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

  async guestCheckout(dto: GuestCheckoutDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order items cannot be empty');
    }

    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const item of dto.items) {
      const product = await this.productService.findById(item.productId);

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}"`,
        );
      }

      subtotal += Number(product.price) * item.quantity;

      const orderItem = this.orderItemRepository.create({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });
      orderItems.push(orderItem);

      product.stock -= item.quantity;
      await this.productService.update(product.id, { stock: product.stock });
    }

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
    const orderCode = await this.generateOrderCode();

    const order = this.orderRepository.create({
      orderCode,
      guestName: dto.guestName,
      guestEmail: dto.guestEmail,
      guestPhone: dto.guestPhone,
      guestShippingAddress: dto.guestShippingAddress,
      totalAmount,
      discountAmount,
      couponId,
      couponCode,
      items: orderItems,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Gửi email xác nhận cho guest
    this.mailService
      .sendOrderConfirmation(dto.guestEmail, savedOrder)
      .catch((err) => this.logger.error(`Guest mail error: ${err.message}`));

    return savedOrder;
  }

  async findAllByUser(
    userId: string,
    query: FilterOrderDto,
  ): Promise<PaginatedResult<Order>> {
    const { take, skip } = paginateRaw(query.page, query.limit);
    const whereCondition: any = { userId };

    if (query.status) {
      whereCondition.status = query.status;
    }

    const [data, totalItems] = await this.orderRepository.findAndCount({
      where: whereCondition,
      relations: ['items', 'items.product', 'coupon', 'addressEntity'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return buildPaginatedResult(data, totalItems, query.page, query.limit);
  }

  async findAll(query: FilterOrderDto): Promise<PaginatedResult<Order>> {
    const { take, skip } = paginateRaw(query.page, query.limit);
    const whereCondition: any = {};

    if (query.status) {
      whereCondition.status = query.status;
    }

    const [data, totalItems] = await this.orderRepository.findAndCount({
      where: whereCondition,
      relations: ['items', 'items.product', 'user', 'coupon', 'addressEntity'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return buildPaginatedResult(data, totalItems, query.page, query.limit);
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'coupon', 'addressEntity'],
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