import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto';
import { CategoryService } from '../category/category.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  PaginatedResult,
  paginateRaw,
  buildPaginatedResult,
} from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categoryService: CategoryService,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const { categoryIds, ...rest } = dto;
    const categories = await this.categoryService.findByIds(categoryIds);
    const product = this.productRepository.create({ ...rest, categories });
    return this.productRepository.save(product);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Product>> {
    const { take, skip } = paginateRaw(pagination.page, pagination.limit);
    const [data, totalItems] = await this.productRepository.findAndCount({
      where: { isActive: true },
      relations: ['categories'],
      take,
      skip,
      order: { createdAt: 'DESC' },
    });
    return buildPaginatedResult(data, totalItems, pagination.page, pagination.limit);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);
    const { categoryIds, ...rest } = dto;
    Object.assign(product, rest);
    if (categoryIds) {
      product.categories = await this.categoryService.findByIds(categoryIds);
    }
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findById(id);
    product.isActive = false;
    await this.productRepository.save(product);
  }

  async findByCategory(
    categoryId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const { take, skip } = paginateRaw(pagination.page, pagination.limit);
    const [data, totalItems] = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.categories', 'category', 'category.id = :categoryId', {
        categoryId,
      })
      .where('product.isActive = :isActive', { isActive: true })
      .leftJoinAndSelect('product.categories', 'cats')
      .take(take)
      .skip(skip)
      .orderBy('product.createdAt', 'DESC')
      .getManyAndCount();
    return buildPaginatedResult(data, totalItems, pagination.page, pagination.limit);
  }
}
