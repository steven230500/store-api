import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryOrmEntity } from '../../../infrastructure/persistence/typeorm/category.orm-entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }
}
