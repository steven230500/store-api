import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WompiEventsController } from './wompi-events.controller';
import { FinalizeTransactionUC } from '../../../application/use-cases/finalize-transaction.uc';
import { TransactionOrmEntity } from '../../../infrastructure/persistence/typeorm/transaction.orm-entity';
import { ProductOrmEntity } from '../../../infrastructure/persistence/typeorm/product.orm-entity';
import { TransactionRepositoryImpl } from '../../../infrastructure/persistence/typeorm/transaction.repository.impl';
import { ProductRepositoryImpl } from '../../../infrastructure/persistence/typeorm/product.repository.impl';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';
import { RawBodyMiddleware } from '../common/raw-body.middleware';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionOrmEntity, ProductOrmEntity])],
  controllers: [WompiEventsController],
  providers: [
    // Implementaciones concretas (deben tener @Injectable())
    TransactionRepositoryImpl,
    ProductRepositoryImpl,

    // Puertos del dominio → adapters concretos
    {
      provide: REPOSITORY_TOKENS.Transaction,
      useExisting: TransactionRepositoryImpl,
    },
    { provide: REPOSITORY_TOKENS.Product, useExisting: ProductRepositoryImpl },

    // Caso de uso
    FinalizeTransactionUC,
  ],
})
export class WompiEventsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RawBodyMiddleware).forRoutes('payments/wompi/transactions');
  }
}
