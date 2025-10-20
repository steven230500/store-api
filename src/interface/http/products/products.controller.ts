import { Controller, Get, Query } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { ProductRepository } from '../../../domain/repositories/product.repository';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(REPOSITORY_TOKENS.Product)
    private readonly products: ProductRepository,
  ) {}

  @Get()
  async findAll() {
    return this.products.findAll();
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const skip = (Number(page) - 1) * Number(limit);
    return this.products.searchByName(query.trim(), {
      skip,
      take: Number(limit),
      order: { name: 'ASC' },
    });
  }
}
