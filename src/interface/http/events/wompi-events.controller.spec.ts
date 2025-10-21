import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { WompiEventsController } from './wompi-events.controller';
import { FinalizeTransactionUC } from '../../../application/use-cases/finalize-transaction.uc';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';
import { TransactionRepository } from '../../../domain/repositories/transaction.repository';
import { TransactionsController } from '../transactions/transactions.controller';
import {
  PAYMENT_STATUS,
  CURRENCY,
} from '../../../domain/constants/payment-status';
import { Transaction } from '../../../domain/entities/transaction.entity';

describe('WompiEventsController', () => {
  let controller: WompiEventsController;
  let mockFinalize: jest.Mocked<FinalizeTransactionUC>;
  let mockTxRepo: jest.Mocked<TransactionRepository>;
  let mockTransactionsController: jest.Mocked<TransactionsController>;

  const mockTransaction = new Transaction(
    'tx-123',
    PAYMENT_STATUS.PENDING,
    10000,
    CURRENCY.COP,
    'prod-123',
    'TX-123',
  );

  beforeEach(async () => {
    mockFinalize = {
      execute: jest.fn(),
    } as any;

    mockTxRepo = {
      findByReference: jest.fn(),
      markEventProcessed: jest.fn(),
    } as any;

    mockTransactionsController = {
      notifyTransactionUpdate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WompiEventsController],
      providers: [
        {
          provide: FinalizeTransactionUC,
          useValue: mockFinalize,
        },
        {
          provide: REPOSITORY_TOKENS.Transaction,
          useValue: mockTxRepo,
        },
        {
          provide: 'TransactionsController',
          useValue: mockTransactionsController,
        },
      ],
    }).compile();

    controller = module.get<WompiEventsController>(WompiEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handle', () => {
    const validPayload = {
      event: 'transaction.updated',
      data: {
        transaction: {
          id: 'wompi-tx-123',
          amount_in_cents: 10000,
          reference: 'TX-123',
          customer_email: 'test@example.com',
          currency: 'COP',
          payment_method_type: 'CARD',
          redirect_url: 'https://example.com',
          status: 'APPROVED',
        },
      },
      environment: 'test',
      signature: {
        properties: ['id', 'status', 'amount_in_cents'],
        checksum: 'valid-checksum',
      },
      timestamp: 1234567890,
      sent_at: '2023-01-01T00:00:00Z',
    };

    beforeEach(() => {
      // Mock environment variable
      process.env.WOMPI_EVENTS_KEY = 'test-secret-key';
    });

    afterEach(() => {
      delete process.env.WOMPI_EVENTS_KEY;
    });

    it('should return ok for valid webhook with transaction update', async () => {
      // Mock valid signature
      jest
        .spyOn(controller as any, 'validateWompiSignature')
        .mockReturnValue(true);

      mockTxRepo.markEventProcessed.mockResolvedValue(true);
      mockTxRepo.findByReference.mockResolvedValue(mockTransaction);
      mockFinalize.execute.mockResolvedValue({
        ...mockTransaction,
        status: 'APPROVED',
      });

      const req = {
        rawBody: Buffer.from(JSON.stringify(validPayload)),
        body: validPayload,
      };

      const result = await controller.handle(req as any);

      expect(result).toEqual({ ok: true });
      expect(mockTxRepo.markEventProcessed).toHaveBeenCalledWith(
        'wompi-tx-123',
      );
      expect(mockTxRepo.findByReference).toHaveBeenCalledWith('TX-123');
      expect(mockFinalize.execute).toHaveBeenCalledWith({
        transactionId: 'tx-123',
        status: 'APPROVED',
        productId: 'prod-123',
      });
      expect(
        mockTransactionsController.notifyTransactionUpdate,
      ).toHaveBeenCalledWith('tx-123', 'APPROVED', expect.any(Object));
    });

    it('should return ok if transaction already processed (idempotency)', async () => {
      jest
        .spyOn(controller as any, 'validateWompiSignature')
        .mockReturnValue(true);

      mockTxRepo.markEventProcessed.mockResolvedValue(false); // Already processed

      const req = {
        rawBody: Buffer.from(JSON.stringify(validPayload)),
        body: validPayload,
      };

      const result = await controller.handle(req as any);

      expect(result).toEqual({ ok: true });
      expect(mockTxRepo.findByReference).not.toHaveBeenCalled();
      expect(mockFinalize.execute).not.toHaveBeenCalled();
    });

    it('should return ok if transaction not found', async () => {
      jest
        .spyOn(controller as any, 'validateWompiSignature')
        .mockReturnValue(true);

      mockTxRepo.markEventProcessed.mockResolvedValue(true);
      mockTxRepo.findByReference.mockResolvedValue(null);

      const req = {
        rawBody: Buffer.from(JSON.stringify(validPayload)),
        body: validPayload,
      };

      const result = await controller.handle(req as any);

      expect(result).toEqual({ ok: true });
      expect(mockFinalize.execute).not.toHaveBeenCalled();
    });

    it('should return ok if transaction has no reference or status', async () => {
      jest.spyOn(controller as any, 'validateWompiSignature').mockReturnValue(true);

      const invalidPayload = {
        ...validPayload,
        data: {
          transaction: {
            ...validPayload.data.transaction,
            reference: null,
            status: null,
          },
        },
      };

      const req = {
        rawBody: Buffer.from(JSON.stringify(invalidPayload)),
        body: invalidPayload,
      };

      const result = await controller.handle(req as any);

      expect(result).toEqual({ ok: true });
      expect(mockTxRepo.markEventProcessed).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      jest
        .spyOn(controller as any, 'validateWompiSignature')
        .mockReturnValue(false);

      const req = {
        rawBody: Buffer.from(JSON.stringify(validPayload)),
        body: validPayload,
      };

      await expect(controller.handle(req as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle missing rawBody by using req.body', async () => {
      jest
        .spyOn(controller as any, 'validateWompiSignature')
        .mockReturnValue(true);

      mockTxRepo.markEventProcessed.mockResolvedValue(true);
      mockTxRepo.findByReference.mockResolvedValue(mockTransaction);
      mockFinalize.execute.mockResolvedValue(
        new Transaction(
          'tx-123',
          PAYMENT_STATUS.APPROVED,
          10000,
          CURRENCY.COP,
          'prod-123',
          'TX-123',
        ),
      );

      const req = {
        body: validPayload,
      };

      const result = await controller.handle(req as any);

      expect(result).toEqual({ ok: true });
    });
  });

  describe('validateWompiSignature', () => {
    beforeEach(() => {
      process.env.WOMPI_EVENTS_KEY = 'test-secret-key';
    });

    afterEach(() => {
      delete process.env.WOMPI_EVENTS_KEY;
    });

    it('should validate correct signature for transaction.updated event', () => {
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            id: 'wompi-tx-123',
            status: 'APPROVED',
            amount_in_cents: 10000,
          },
        },
        timestamp: 1234567890,
        signature: {
          checksum: 'expected-hash',
        },
      };

      // Mock createHash to return expected hash
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('expected-hash'),
      };
      jest
        .spyOn(require('crypto'), 'createHash')
        .mockReturnValue(mockHash as any);

      const result = (controller as any).validateWompiSignature(payload);

      expect(result).toBe(true);
      expect(require('crypto').createHash).toHaveBeenCalledWith('sha256');
    });

    it('should return false for unsupported event type', () => {
      const payload = {
        event: 'unsupported.event',
        data: {
          transaction: {
            id: 'wompi-tx-123',
            status: 'APPROVED',
            amount_in_cents: 10000,
          },
        },
        timestamp: 1234567890,
        signature: {
          checksum: 'hash',
        },
      };

      const result = (controller as any).validateWompiSignature(payload);

      expect(result).toBe(false);
    });

    it('should return false if WOMPI_EVENTS_KEY is not set', () => {
      delete process.env.WOMPI_EVENTS_KEY;

      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            id: 'wompi-tx-123',
            status: 'APPROVED',
            amount_in_cents: 10000,
          },
        },
        timestamp: 1234567890,
        signature: {
          checksum: 'hash',
        },
      };

      const result = (controller as any).validateWompiSignature(payload);

      expect(result).toBe(false);
    });

    it('should return false for invalid signature', () => {
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            id: 'wompi-tx-123',
            status: 'APPROVED',
            amount_in_cents: 10000,
          },
        },
        timestamp: 1234567890,
        signature: {
          checksum: 'invalid-hash',
        },
      };

      const mockCreateHash = jest.spyOn(require('crypto'), 'createHash');
      mockCreateHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('different-hash'),
      } as any);

      const result = (controller as any).validateWompiSignature(payload);

      expect(result).toBe(false);
    });
  });
});
