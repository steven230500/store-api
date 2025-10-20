import { Injectable, Inject } from '@nestjs/common';
import { Transaction } from '../../domain/entities/transaction.entity';
import type { TransactionRepository } from '../../domain/repositories/transaction.repository';
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
  ) {}

  async execute(input: {
    productId: string;
    amountInCents: number;
    currency: Currency;
  }) {
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
