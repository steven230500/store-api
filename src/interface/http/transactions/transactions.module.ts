import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionOrmEntity } from '../../../infrastructure/persistence/typeorm/transaction.orm-entity';
import { TransactionRepositoryImpl } from '../../../infrastructure/persistence/typeorm/transaction.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionOrmEntity])],
  controllers: [TransactionsController],
  providers: [
    { provide: 'TransactionRepository', useClass: TransactionRepositoryImpl },
  ],
})
export class TransactionsModule {}
