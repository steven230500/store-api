import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { ProductOrmEntity } from '../../../infrastructure/persistence/typeorm/product.orm-entity';
import { TransactionOrmEntity } from '../../../infrastructure/persistence/typeorm/transaction.orm-entity';
import { TransactionRepositoryImpl } from '../../../infrastructure/persistence/typeorm/transaction.repository.impl';
import { ProductRepositoryImpl } from '../../../infrastructure/persistence/typeorm/product.repository.impl';
import { CreatePendingTransactionUC } from '../../../application/use-cases/create-pending-transaction.uc';
import { ProcessPaymentWithWompiUC } from '../../../application/use-cases/process-payment-with-wompi.uc';
import { FinalizeTransactionUC } from '../../../application/use-cases/finalize-transaction.uc';
import { WompiGateway } from '../../../infrastructure/gateways/wompi.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity, TransactionOrmEntity])],
  controllers: [PaymentsController],
  providers: [
    TransactionRepositoryImpl,
    ProductRepositoryImpl,
    {
      provide: 'TransactionRepository',
      useExisting: TransactionRepositoryImpl,
    },
    { provide: 'ProductRepository', useExisting: ProductRepositoryImpl },
    CreatePendingTransactionUC,
    ProcessPaymentWithWompiUC,
    FinalizeTransactionUC,
    WompiGateway,
    { provide: 'PaymentGateway', useExisting: WompiGateway },
  ],
  exports: [],
})
export class PaymentsModule {}
