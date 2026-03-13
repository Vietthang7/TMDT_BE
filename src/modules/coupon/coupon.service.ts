import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto, UpdateCouponDto } from './dto';
import { DiscountType } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  PaginatedResult,
  paginateRaw,
  buildPaginatedResult,
} from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponRepository.findOne({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Coupon code "${dto.code}" already exists`);
    }

    const coupon = this.couponRepository.create({
      ...dto,
      code: dto.code.toUpperCase(),
    });
    return this.couponRepository.save(coupon);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Coupon>> {
    const { take, skip } = paginateRaw(pagination.page, pagination.limit);
    const [data, totalItems] = await this.couponRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return buildPaginatedResult(data, totalItems, pagination.page, pagination.limit);
  }

  async findById(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID "${id}" not found`);
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findById(id);
    if (dto.code) {
      dto.code = dto.code.toUpperCase();
    }
    Object.assign(coupon, dto);
    return this.couponRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findById(id);
    coupon.isActive = false;
    await this.couponRepository.save(coupon);
  }

  async validateCoupon(code: string, orderAmount: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code: code.toUpperCase(), isActive: true },
    });

    if (!coupon) {
      throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa');
    }

    const now = new Date();
    if (coupon.startDate && now < new Date(coupon.startDate)) {
      throw new BadRequestException('Mã giảm giá chưa đến thời gian sử dụng');
    }
    if (coupon.endDate && now > new Date(coupon.endDate)) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    if (orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${coupon.minOrderAmount} để sử dụng mã này`,
      );
    }

    return coupon;
  }

  calculateDiscount(coupon: Coupon, orderAmount: number): number {
    let discount: number;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = orderAmount * (Number(coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
        discount = Number(coupon.maxDiscountAmount);
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    if (discount > orderAmount) {
      discount = orderAmount;
    }

    return Math.round(discount * 100) / 100;
  }

  async incrementUsage(couponId: string): Promise<void> {
    await this.couponRepository.increment({ id: couponId }, 'usedCount', 1);
  }
}
