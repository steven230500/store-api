import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import envValidation from './config/env.validation';
import { PaymentsModule } from './interface/http/payments/payments.module';
import { ProductsModule } from './interface/http/products/products.module';
import { CategoriesModule } from './interface/http/categories/categories.module';
import { TransactionsModule } from './interface/http/transactions/transactions.module';
import { WompiEventsModule } from './interface/http/events/wompi-events.module';
import { HealthModule } from './interface/http/health/health.module';
import { OrmConfig } from './infrastructure/persistence/typeorm/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
      validate: envValidation,
    }),
    TypeOrmModule.forRootAsync({ useClass: OrmConfig }),
    PaymentsModule,
    ProductsModule,
    CategoriesModule,
    TransactionsModule,
    WompiEventsModule,
    HealthModule,
  ],
})
export class AppModule {}
