import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionRepositoryImpl } from './transaction.repository.impl';
import { TransactionOrmEntity } from './transaction.orm-entity';
import { Transaction } from '../../../domain/entities/transaction.entity';
import {
  PAYMENT_STATUS,
  CURRENCY,
} from '../../../domain/constants/payment-status';

describe('TransactionRepositoryImpl', () => {
  let repository: TransactionRepositoryImpl;
  let mockRepo: {
    create: jest.MockedFunction<(data: any) => TransactionOrmEntity>;
    save: jest.MockedFunction<
      (entity: TransactionOrmEntity) => Promise<TransactionOrmEntity>
    >;
    findOneBy: jest.MockedFunction<
      (
        criteria: { id: string } | { reference: string },
      ) => Promise<TransactionOrmEntity | null>
    >;
    update: jest.MockedFunction<
      (criteria: { id: string }, data: any) => Promise<any>
    >;
    manager: {
      query: jest.MockedFunction<
        (query: string, params: any[]) => Promise<any>
      >;
    };
  };

  const mockTransactionOrm: TransactionOrmEntity = {
    id: 'tx-1',
    status: PAYMENT_STATUS.PENDING,
    amount_in_cents: 10000,
    currency: CURRENCY.COP,
    product_id: 'product-1',
    reference: 'TX-123',
    external_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      manager: {
        query: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepositoryImpl,
        {
          provide: getRepositoryToken(TransactionOrmEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    repository = module.get<TransactionRepositoryImpl>(
      TransactionRepositoryImpl,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('save', () => {
    it('should save transaction', async () => {
      const transaction = new Transaction(
        'tx-1',
        PAYMENT_STATUS.PENDING,
        10000,
        CURRENCY.COP,
        'product-1',
        'TX-123',
      );

      mockRepo.create.mockReturnValue(mockTransactionOrm);
      mockRepo.save.mockResolvedValue(mockTransactionOrm);

      await repository.save(transaction);

      expect(mockRepo.create).toHaveBeenCalledWith({
        id: 'tx-1',
        status: PAYMENT_STATUS.PENDING,
        amount_in_cents: 10000,
        currency: CURRENCY.COP,
        product_id: 'product-1',
        reference: 'TX-123',
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt,
      });
      expect(mockRepo.save).toHaveBeenCalledWith(mockTransactionOrm);
    });
  });

  describe('findById', () => {
    it('should return transaction when found', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockTransactionOrm);

      const result = await repository.findById('tx-1');

      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: 'tx-1' });
      expect(result).toBeInstanceOf(Transaction);
      expect(result?.id).toBe('tx-1');
      expect(result?.status).toBe(PAYMENT_STATUS.PENDING);
    });

    it('should return null when transaction not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByReference', () => {
    it('should return transaction when found by reference', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockTransactionOrm);

      const result = await repository.findByReference('TX-123');

      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ reference: 'TX-123' });
      expect(result).toBeInstanceOf(Transaction);
      expect(result?.reference).toBe('TX-123');
    });

    it('should return null when transaction not found by reference', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      const result = await repository.findByReference('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('setStatus', () => {
    it('should update transaction status', async () => {
      await repository.setStatus('tx-1', PAYMENT_STATUS.APPROVED, 'ext-123');

      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'tx-1' },
        { status: PAYMENT_STATUS.APPROVED, external_id: 'ext-123' },
      );
    });

    it('should update transaction status without external id', async () => {
      await repository.setStatus('tx-1', PAYMENT_STATUS.DECLINED);

      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'tx-1' },
        { status: PAYMENT_STATUS.DECLINED, external_id: undefined },
      );
    });
  });

  describe('markEventProcessed', () => {
    it('should return true when event is successfully marked as processed', async () => {
      mockRepo.manager.query.mockResolvedValue(undefined);

      const result = await repository.markEventProcessed('event-1');

      expect(mockRepo.manager.query).toHaveBeenCalledWith(
        'INSERT INTO webhook_events (id) VALUES ($1)',
        ['event-1'],
      );
      expect(result).toBe(true);
    });

    it('should return false when event processing fails', async () => {
      mockRepo.manager.query.mockRejectedValue(new Error('Duplicate key'));

      const result = await repository.markEventProcessed('event-1');

      expect(result).toBe(false);
    });
  });
});
