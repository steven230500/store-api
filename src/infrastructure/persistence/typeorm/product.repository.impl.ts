import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { ProductOrmEntity } from './product.orm-entity';
import { Product } from '../../../domain/entities/product.entity';
import { ERROR_MESSAGES } from '../../../domain/constants/payment-status';

@Injectable()
export class ProductRepositoryImpl implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.repo.find({ order: { name: 'ASC' } });
    return rows.map(
      (r) =>
        new Product(
          r.id,
          r.name,
          r.price_in_cents,
          r.currency,
          r.stock,
          r.created_at,
          r.updated_at,
        ),
    );
  }

  async findById(id: string): Promise<Product | null> {
    const r = await this.repo.findOne({ where: { id } });
    return r
      ? new Product(
          r.id,
          r.name,
          r.price_in_cents,
          r.currency,
          r.stock,
          r.created_at,
          r.updated_at,
        )
      : null;
  }

  async findByCategory(
    categoryId: string,
    options?: {
      skip?: number;
      take?: number;
      order?: Record<string, 'ASC' | 'DESC'>;
    },
  ): Promise<Product[]> {
    const query = this.repo
      .createQueryBuilder('p')
      .where('p.category_id = :categoryId', { categoryId });

    if (options?.order) {
      query.orderBy(options.order);
    }

    if (options?.skip !== undefined) {
      query.skip(options.skip);
    }

    if (options?.take !== undefined) {
      query.take(options.take);
    }

    const rows = await query.getMany();
    return rows.map(
      (r) =>
        new Product(
          r.id,
          r.name,
          r.price_in_cents,
          r.currency,
          r.stock,
          r.created_at,
          r.updated_at,
        ),
    );
  }

  async decreaseStock(id: string, qty: number): Promise<void> {
    await this.repo.manager.transaction(async (tx) => {
      const pr = await tx
        .getRepository(ProductOrmEntity)
        .findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!pr) throw new Error(ERROR_MESSAGES.PRODUCT_NOT_FOUND as string);
      if (pr.stock < qty)
        throw new Error(ERROR_MESSAGES.OUT_OF_STOCK as string);
      pr.stock -= qty;
      await tx.getRepository(ProductOrmEntity).save(pr);
    });
  }
}
