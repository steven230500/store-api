import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryOrmEntity } from '../../../infrastructure/persistence/typeorm/category.orm-entity';
import { ProductOrmEntity } from '../../../infrastructure/persistence/typeorm/product.orm-entity';
import { ProductRepositoryImpl } from '../../../infrastructure/persistence/typeorm/product.repository.impl';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrmEntity, ProductOrmEntity])],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: REPOSITORY_TOKENS.Product,
      useClass: ProductRepositoryImpl,
    },
  ],
})
export class CategoriesModule {}
