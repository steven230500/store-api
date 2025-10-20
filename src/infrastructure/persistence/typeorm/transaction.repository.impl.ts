import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TransactionRepository } from '../../../domain/repositories/transaction.repository';
import { TransactionOrmEntity } from './transaction.orm-entity';
import { Transaction } from '../../../domain/entities/transaction.entity';

@Injectable()
export class TransactionRepositoryImpl implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repo: Repository<TransactionOrmEntity>,
  ) {}

  async save(transaction: Transaction): Promise<void> {
    const entity = this.repo.create({
      id: transaction.id,
      status: transaction.status,
      amount_in_cents: transaction.amountInCents,
      currency: transaction.currency,
      product_id: transaction.productId,
      reference: transaction.reference,
      created_at: transaction.createdAt,
      updated_at: transaction.updatedAt,
    });
    await this.repo.save(entity);
  }

  async findById(id: string): Promise<Transaction | null> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) return null;
    return new Transaction(
      entity.id,
      entity.status,
      entity.amount_in_cents,
      entity.currency as 'COP',
      entity.product_id,
      entity.reference,
      entity.created_at,
      entity.updated_at,
    );
  }

  async findByReference(ref: string): Promise<Transaction | null> {
    const entity = await this.repo.findOneBy({ reference: ref });
    if (!entity) return null;
    return new Transaction(
      entity.id,
      entity.status,
      entity.amount_in_cents,
      entity.currency as 'COP',
      entity.product_id,
      entity.reference,
      entity.created_at,
      entity.updated_at,
    );
  }

  async setStatus(
    id: string,
    status: Transaction['status'],
    externalId?: string | null,
  ): Promise<void> {
    await this.repo.update({ id }, { status, external_id: externalId });
  }

  async markEventProcessed(eventId: string): Promise<boolean> {
    try {
      await this.repo.manager.query(
        'INSERT INTO webhook_events (id) VALUES ($1)',
        [eventId],
      );
      return true;
    } catch {
      return false;
    }
  }
}
