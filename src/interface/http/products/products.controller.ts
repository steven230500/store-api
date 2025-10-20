import { Controller, Get } from '@nestjs/common';
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
}
