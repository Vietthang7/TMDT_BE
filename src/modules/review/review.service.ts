import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Order } from '../order/entities/order.entity';
import { Product } from '../product/entities/product.entity';
import { CreateReviewDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  PaginatedResult,
  paginateRaw,
  buildPaginatedResult,
} from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    // 1. Kiểm tra đã review chưa
    const existing = await this.reviewRepo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existing) {
      throw new ConflictException('Bạn đã đánh giá sản phẩm này rồi');
    }

    // 2. Kiểm tra đã mua sản phẩm này chưa + trong vòng 48h
    const order = await this.orderRepo
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .where('order.userId = :userId', { userId })
      .andWhere('item.productId = :productId', { productId: dto.productId })
      .orderBy('order.createdAt', 'DESC')
      .getOne();

    if (!order) {
      throw new BadRequestException(
        'Bạn chưa mua sản phẩm này nên không thể đánh giá',
      );
    }

    const hoursSinceOrder =
      (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceOrder > 48) {
      throw new BadRequestException(
        'Đã quá 48 giờ kể từ khi đặt hàng, không thể đánh giá',
      );
    }

    // 3. Tạo review
    const review = this.reviewRepo.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      comment: dto.comment,
    });
    const savedReview = await this.reviewRepo.save(review);

    // 4. Cập nhật rating trung bình
    await this.updateProductRating(dto.productId);

    return savedReview;
  }

  async getByProduct(
    productId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Review>> {
    const { take, skip } = paginateRaw(pagination.page, pagination.limit);
    const [data, totalItems] = await this.reviewRepo.findAndCount({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return buildPaginatedResult(data, totalItems, pagination.page, pagination.limit);
  }

  private async updateProductRating(productId: string): Promise<void> {
    const result = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.productId = :productId', { productId })
      .getRawOne();

    await this.productRepo.update(productId, {
      averageRating: Number(Number(result.avg).toFixed(2)),
      reviewCount: Number(result.count),
    });
  }
}
