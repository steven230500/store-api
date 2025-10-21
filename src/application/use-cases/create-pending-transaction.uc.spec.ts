import { Test, TestingModule } from '@nestjs/testing';
import { CreatePendingTransactionUC } from './create-pending-transaction.uc';
import { Transaction } from '../../domain/entities/transaction.entity';
import { REPOSITORY_TOKENS } from '../../domain/repositories/tokens';
import { CURRENCY } from '../../domain/constants/payment-status';

describe('CreatePendingTransactionUC', () => {
  let useCase: CreatePendingTransactionUC;

  const mockTransactionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProductRepo = {
    findById: jest.fn(),
    updateStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePendingTransactionUC,
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

    useCase = module.get<CreatePendingTransactionUC>(
      CreatePendingTransactionUC,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create pending transaction successfully', async () => {
    const mockProduct = {
      id: 'product-1',
      name: 'Test Product',
      price_in_cents: 10000,
      stock: 10,
    };

    mockProductRepo.findById.mockResolvedValue(mockProduct);
    mockTransactionRepo.save.mockImplementation((tx) => Promise.resolve(tx));

    const result = await useCase.execute({
      productId: 'product-1',
      amountInCents: 10000,
      currency: CURRENCY.COP,
    });

    expect(result).toBeInstanceOf(Transaction);
    expect(result.status).toBe('PENDING');
    expect(result.amountInCents).toBe(10000);
    expect(result.currency).toBe(CURRENCY.COP);
    expect(result.productId).toBe('product-1');
    expect(mockProductRepo.findById).toHaveBeenCalledWith('product-1');
    expect(mockTransactionRepo.save).toHaveBeenCalled();
  });

  it('should throw error if product not found', async () => {
    mockProductRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        productId: 'non-existent',
        amountInCents: 10000,
        currency: CURRENCY.COP,
      }),
    ).rejects.toThrow('Product not found');
  });

  it('should throw error if insufficient stock', async () => {
    const mockProduct = {
      id: 'product-1',
      name: 'Test Product',
      price_in_cents: 10000,
      stock: 0, // No stock
    };

    mockProductRepo.findById.mockResolvedValue(mockProduct);

    await expect(
      useCase.execute({
        productId: 'product-1',
        amountInCents: 10000,
        currency: CURRENCY.COP,
      }),
    ).rejects.toThrow('Insufficient stock');
  });
});
