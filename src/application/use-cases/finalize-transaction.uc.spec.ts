import { Test, TestingModule } from '@nestjs/testing';
import { FinalizeTransactionUC } from './finalize-transaction.uc';
import { REPOSITORY_TOKENS } from '../../domain/repositories/tokens';

describe('FinalizeTransactionUC', () => {
  let useCase: FinalizeTransactionUC;

  const mockTransactionRepo = {
    findById: jest.fn(),
    save: jest.fn(),
  };

  const mockProductRepo = {
    findById: jest.fn(),
    updateStock: jest.fn(),
    decreaseStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizeTransactionUC,
        {
          provide: REPOSITORY_TOKENS.Transaction,
          useValue: mockTransactionRepo,
        },
        {
          provide: REPOSITORY_TOKENS.Product,
          useValue: mockProductRepo,
        },
      ],
    }).compile();

    useCase = module.get<FinalizeTransactionUC>(FinalizeTransactionUC);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should finalize transaction as APPROVED and update stock', async () => {
    const mockTransaction = {
      id: 'tx-1',
      status: 'PENDING',
      productId: 'product-1',
      amountInCents: 10000,
    };

    const mockProduct = {
      id: 'product-1',
      stock: 10,
    };

    const updatedTransaction = {
      ...mockTransaction,
      status: 'APPROVED',
    };

    mockTransactionRepo.findById.mockResolvedValue(mockTransaction);
    mockProductRepo.findById.mockResolvedValue(mockProduct);
    mockTransactionRepo.save.mockResolvedValue(updatedTransaction);
    mockProductRepo.decreaseStock = jest.fn().mockResolvedValue(undefined);

    const result = await useCase.execute({
      transactionId: 'tx-1',
      status: 'APPROVED',
      productId: 'product-1',
    });

    expect(result).toEqual(updatedTransaction);
    expect(mockTransactionRepo.save).toHaveBeenCalledWith(updatedTransaction);
    expect(mockProductRepo.decreaseStock).toHaveBeenCalledWith('product-1', 1); // Reduce stock by 1
  });

  it('should finalize transaction as DECLINED without updating stock', async () => {
    const mockTransaction = {
      id: 'tx-1',
      status: 'PENDING',
      productId: 'product-1',
    };

    const updatedTransaction = {
      ...mockTransaction,
      status: 'DECLINED',
    };

    mockTransactionRepo.findById.mockResolvedValue(mockTransaction);
    mockTransactionRepo.save.mockResolvedValue(updatedTransaction);

    const result = await useCase.execute({
      transactionId: 'tx-1',
      status: 'DECLINED',
      productId: 'product-1',
    });

    expect(result).toEqual(updatedTransaction);
    expect(mockProductRepo.updateStock).not.toHaveBeenCalled(); // No stock update for declined
  });

  it('should throw error if transaction not found', async () => {
    mockTransactionRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        transactionId: 'non-existent',
        status: 'APPROVED',
        productId: 'product-1',
      }),
    ).rejects.toThrow('Transaction not found');
  });
});
