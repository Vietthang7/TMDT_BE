import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Wishlist } from './entities/wishlist.entity';
import { WishlistItem } from './entities/wishlist-item.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepo: Repository<Wishlist>,

    @InjectRepository(WishlistItem)
    private itemRepo: Repository<WishlistItem>,
  ) {}

  async getOrCreateWishlist(userId: string) {
    let wishlist = await this.wishlistRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!wishlist) {
      wishlist = this.wishlistRepo.create({
        user: { id: userId },
      });
      wishlist = await this.wishlistRepo.save(wishlist);
    }

    return wishlist;
  }

  async getList(userId: string, paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    // limit max
    const safeLimit = Math.min(limit, 100);

    const wishlist = await this.getOrCreateWishlist(userId);

    const [data, total] = await this.itemRepo.findAndCount({
      where: {
        wishlist: { id: wishlist.id },
      },
      relations: ['product'],
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit: safeLimit,
        totalPage: Math.ceil(total / safeLimit),
      },
    };
  }

  async add(userId: string, productId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);

    const exist = await this.itemRepo.findOne({
      where: {
        wishlist: { id: wishlist.id },
        product: { id: productId },
      },
    });

    if (exist) {
      throw new BadRequestException('Already in wishlist');
    }

    const item = this.itemRepo.create({
      wishlist: { id: wishlist.id },
      product: { id: productId },
    });

    return await this.itemRepo.save(item);
  }

  async remove(userId: string, productId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);

    const item = await this.itemRepo.findOne({
      where: {
        wishlist: { id: wishlist.id },
        product: { id: productId },
      },
    });

    if (!item) {
      throw new NotFoundException('Not found');
    }

    return await this.itemRepo.remove(item);
  }
}