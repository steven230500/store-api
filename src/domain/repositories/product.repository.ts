import { Product } from '../entities/product.entity';

export interface ProductRepository {
  findAll(): Promise<Array<Product>>;
  findById(id: string): Promise<Product | null>;
  decreaseStock(id: string, qty: number): Promise<void>;
  findByCategory(
    categoryId: string,
    options?: { skip?: number; take?: number; order?: any },
  ): Promise<Array<Product>>;
}
