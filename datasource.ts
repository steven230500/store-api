import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config(); // lee .env

// importa todas tus entidades
import { ProductOrmEntity } from './src/infrastructure/persistence/typeorm/product.orm-entity';
import { CategoryOrmEntity } from './src/infrastructure/persistence/typeorm/category.orm-entity';
import { TransactionOrmEntity } from './src/infrastructure/persistence/typeorm/transaction.orm-entity';
import { WebhookEventOrmEntity } from './src/infrastructure/persistence/typeorm/webhook-event.orm-entity';

const isProd = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    ProductOrmEntity,
    CategoryOrmEntity,
    TransactionOrmEntity,
    WebhookEventOrmEntity,
  ],
  migrations: ['dist/src/migrations/*.js'],
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  logging: !isProd,
});
