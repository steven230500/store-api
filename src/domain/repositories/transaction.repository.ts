import { Transaction } from '../entities/transaction.entity';

export interface TransactionRepository {
  save(tx: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByReference(ref: string): Promise<Transaction | null>;
  setStatus(
    id: string,
    status: Transaction['status'],
    externalId?: string | null,
  ): Promise<void>;
  markEventProcessed(eventId: string): Promise<boolean>;
}
