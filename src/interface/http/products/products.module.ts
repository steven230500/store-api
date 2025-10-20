import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductOrmEntity } from '../../../infrastructure/persistence/typeorm/product.orm-entity';
import { ProductRepositoryImpl } from '../../../infrastructure/persistence/typeorm/product.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductsController],
  providers: [
    { provide: 'ProductRepository', useClass: ProductRepositoryImpl },
  ],
})
export class ProductsModule {}
