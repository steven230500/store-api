import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ProductOrmEntity } from './product.orm-entity';
import { TransactionOrmEntity } from './transaction.orm-entity';
import { CategoryOrmEntity } from './category.orm-entity';

@Injectable()
export class OrmConfig implements TypeOrmOptionsFactory {
  constructor(private readonly cfg: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProd = process.env.NODE_ENV === 'production';
    const options = {
      type: 'postgres' as const,
      host: this.cfg.get<string>('POSTGRES_HOST') || 'db',
      port: this.cfg.get<number>('POSTGRES_PORT') || 5432,
      username: this.cfg.get<string>('POSTGRES_USER') || 'postgres',
      password: this.cfg.get<string>('POSTGRES_PASSWORD') || 'postgres',
      database: this.cfg.get<string>('POSTGRES_DB') || 'wompi_challenge',
      entities: [ProductOrmEntity, TransactionOrmEntity, CategoryOrmEntity],
      synchronize: false,
      ssl: isProd ? { rejectUnauthorized: false } : false,
      logging: !isProd,
    };

    return options;
  }
}
