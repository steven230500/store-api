import type { Currency, PaymentStatus } from '../constants/payment-status';

export type TransactionStatus = PaymentStatus;

export class Transaction {
  constructor(
    public readonly id: string,
    public status: TransactionStatus,
    public amountInCents: number,
    public currency: Currency,
    public productId: string,
    public reference: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}
}
