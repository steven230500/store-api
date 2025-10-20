import { Controller, Get, Param } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { TransactionRepository } from '../../../domain/repositories/transaction.repository';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';
import { ERROR_MESSAGES } from '../../../domain/constants/payment-status';

@Controller('transactions')
export class TransactionsController {
  constructor(
    @Inject(REPOSITORY_TOKENS.Transaction)
    private readonly txRepo: TransactionRepository,
  ) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    const tx = await this.txRepo.findById(id);
    if (!tx) throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    return tx;
  }
}
