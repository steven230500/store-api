import { Injectable, Inject } from '@nestjs/common';
import { Transaction } from '../../domain/entities/transaction.entity';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import {
  PAYMENT_STATUS,
  CURRENCY,
  type Currency,
} from '../../domain/constants/payment-status';
import { REPOSITORY_TOKENS } from '../../domain/repositories/tokens';

@Injectable()
export class CreatePendingTransactionUC {
  constructor(
    @Inject(REPOSITORY_TOKENS.Transaction)
    private readonly txRepo: TransactionRepository,
    @Inject(REPOSITORY_TOKENS.Product)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(input: {
    productId: string;
    amountInCents: number;
    currency: Currency;
  }) {
    // Validate product exists
    const product = await this.productRepo.findById(input.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Validate sufficient stock
    if (product.stock <= 0) {
      throw new Error('Insufficient stock');
    }

    const reference = `TX-${Date.now()}`;
    const tx = new Transaction(
      crypto.randomUUID(),
      PAYMENT_STATUS.PENDING,
      input.amountInCents,
      CURRENCY.COP,
      input.productId,
      reference,
    );
    await this.txRepo.save(tx);
    return tx;
  }
}
