import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  PaginatedResult,
  paginateRaw,
  buildPaginatedResult,
} from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Category "${dto.name}" already exists`,
      );
    }
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Category>> {
    const { take, skip } = paginateRaw(pagination.page, pagination.limit);
    const [data, totalItems] = await this.categoryRepository.findAndCount({
      where: { isActive: true },
      take,
      skip,
      order: { createdAt: 'DESC' },
    });
    return buildPaginatedResult(data, totalItems, pagination.page, pagination.limit);
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  async findByIds(ids: string[]): Promise<Category[]> {
    return this.categoryRepository.find({ where: { id: In(ids) } });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findById(id);
    category.isActive = false;
    await this.categoryRepository.save(category);
  }
}
