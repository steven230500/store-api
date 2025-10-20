import { Injectable, Inject } from '@nestjs/common';
import { REPOSITORY_TOKENS } from '../../domain/repositories/tokens';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import {
  PAYMENT_STATUS,
  type PaymentStatus,
  ERROR_MESSAGES,
} from '../../domain/constants/payment-status';

@Injectable()
export class FinalizeTransactionUC {
  constructor(
    @Inject(REPOSITORY_TOKENS.Transaction)
    private readonly txRepo: TransactionRepository,
    @Inject(REPOSITORY_TOKENS.Product)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(input: {
    transactionId: string;
    status: PaymentStatus;
    productId: string;
  }) {
    const tx = await this.txRepo.findById(input.transactionId);
    if (!tx) throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    tx.status = input.status;
    await this.txRepo.save(tx);
    if (input.status === PAYMENT_STATUS.APPROVED) {
      await this.productRepo.decreaseStock(input.productId, 1);
    }
    return tx;
  }
}
