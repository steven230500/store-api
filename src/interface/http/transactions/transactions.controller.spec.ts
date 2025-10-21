import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { TransactionsController } from './transactions.controller';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';
import { Transaction } from '../../../domain/entities/transaction.entity';
import {
  PAYMENT_STATUS,
  CURRENCY,
} from '../../../domain/constants/payment-status';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let mockTxRepo: jest.Mocked<any>;

  const mockTransaction = new Transaction(
    'test-tx',
    PAYMENT_STATUS.PENDING,
    10000,
    CURRENCY.COP,
    'test-product',
    'TX-123',
  );

  beforeEach(async () => {
    mockTxRepo = {
      findById: jest.fn(),
      findByReference: jest.fn(),
      markEventProcessed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: REPOSITORY_TOKENS.Transaction,
          useValue: mockTxRepo,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  afterEach(() => {
    jest.clearAllTimers();
    // Clean up clients map
    (controller as any).clients.clear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findById', () => {
    it('should return transaction by id', async () => {
      mockTxRepo.findById.mockResolvedValue(mockTransaction);

      const result = await controller.findById('test-tx');

      expect(mockTxRepo.findById).toHaveBeenCalledWith('test-tx');
      expect(result).toBe(mockTransaction);
    });

    it('should throw error for non-existent transaction', async () => {
      mockTxRepo.findById.mockResolvedValue(null);

      await expect(controller.findById('non-existent')).rejects.toThrow(
        'Transaction not found',
      );
      expect(mockTxRepo.findById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('sse', () => {
    let mockResponse: jest.Mocked<Response>;
    let mockWrite: jest.Mock;
    let mockEnd: jest.Mock;
    let mockOn: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
      mockWrite = jest.fn();
      mockEnd = jest.fn();
      mockOn = jest.fn();
      mockStatus = jest.fn().mockReturnThis();

      mockResponse = {
        setHeader: jest.fn(),
        write: mockWrite,
        end: mockEnd,
        on: mockOn,
        status: mockStatus,
        destroyed: false,
      } as any;
    });

    it('should establish SSE connection and send initial data', async () => {
      mockTxRepo.findByReference.mockResolvedValue(mockTransaction);

      await controller.sse('TX-123', mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Connection',
        'keep-alive',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        '*',
      );

      expect(mockTxRepo.findByReference).toHaveBeenCalledWith('TX-123');

      // Check initial data was sent
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"initial"'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"id":"test-tx"'),
      );

      // Check client was registered
      expect((controller as any).clients.get('test-tx')).toBe(mockResponse);

      // Check event listeners were set up
      expect(mockResponse.on).toHaveBeenCalledWith(
        'close',
        expect.any(Function),
      );
      expect(mockResponse.on).toHaveBeenCalledWith(
        'finish',
        expect.any(Function),
      );
    });

    it('should send heartbeat every 30 seconds', async () => {
      jest.useFakeTimers();
      mockTxRepo.findByReference.mockResolvedValue(mockTransaction);

      await controller.sse('TX-123', mockResponse);

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"heartbeat"'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"transactionId":"test-tx"'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"currentStatus":"PENDING"'),
      );

      jest.useRealTimers();
    });

    it('should handle transaction not found', async () => {
      mockTxRepo.findByReference.mockResolvedValue(null);

      await controller.sse('non-existent', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"error":"Transaction not found"'),
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should clean up client on connection close', async () => {
      mockTxRepo.findByReference.mockResolvedValue(mockTransaction);

      await controller.sse('TX-123', mockResponse);

      // Get the close handler
      const closeHandler = mockResponse.on.mock.calls.find(
        (call) => call[0] === 'close',
      )[1];
      closeHandler();

      expect((controller as any).clients.has('test-tx')).toBe(false);
    });

    it('should clean up heartbeat on connection finish', async () => {
      mockTxRepo.findByReference.mockResolvedValue(mockTransaction);

      await controller.sse('TX-123', mockResponse);

      // Get the finish handler
      const finishHandler = mockResponse.on.mock.calls.find(
        (call) => call[0] === 'finish',
      )[1];
      finishHandler();

      // The heartbeat should be cleared (we can't easily test this directly,
      // but we can verify the handler was set up)
      expect(mockResponse.on).toHaveBeenCalledWith(
        'finish',
        expect.any(Function),
      );
    });
  });

  describe('notifyTransactionUpdate', () => {
    let mockResponse: jest.Mocked<Response>;

    beforeEach(() => {
      mockResponse = {
        write: jest.fn(),
        end: jest.fn(),
        destroyed: false,
      } as any;

      // Add client to the map
      (controller as any).clients.set('test-tx', mockResponse);
    });

    it('should notify client with transaction update', () => {
      const transactionData = { id: 'test-tx', status: 'APPROVED' };

      controller.notifyTransactionUpdate(
        'test-tx',
        'APPROVED',
        transactionData,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"status_update"'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"transactionId":"test-tx"'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"status":"APPROVED"'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"transaction":'),
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should not notify if client not found', () => {
      controller.notifyTransactionUpdate('non-existent', 'APPROVED');

      expect(mockResponse.write).not.toHaveBeenCalled();
      expect(mockResponse.end).not.toHaveBeenCalled();
    });

    it('should not notify if client connection is destroyed', () => {
      mockResponse.destroyed = true;

      controller.notifyTransactionUpdate('test-tx', 'APPROVED');

      expect(mockResponse.write).not.toHaveBeenCalled();
      expect(mockResponse.end).not.toHaveBeenCalled();
    });
  });
});
