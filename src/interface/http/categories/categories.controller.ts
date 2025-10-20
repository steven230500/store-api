import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Inject } from '@nestjs/common';
import type { ProductRepository } from '../../../domain/repositories/product.repository';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly service: CategoriesService,
    @Inject(REPOSITORY_TOKENS.Product)
    private readonly productsRepo: ProductRepository,
  ) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Get(':id/products')
  getProductsByCategory(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    return this.productsRepo.findByCategory(id, {
      skip,
      take: Number(limit),
      order: { name: 'ASC' },
    });
  }
}
