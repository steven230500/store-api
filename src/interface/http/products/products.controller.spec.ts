import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';
import { Product } from '../../../domain/entities/product.entity';
import { CURRENCY } from '../../../domain/constants/payment-status';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockProductRepo: jest.Mocked<any>;

  const mockProducts: Product[] = [
    new Product(
      '1',
      'Test Product 1',
      10000,
      CURRENCY.COP,
      10,
      new Date(),
      new Date(),
    ),
    new Product(
      '2',
      'Test Product 2',
      20000,
      CURRENCY.COP,
      5,
      new Date(),
      new Date(),
    ),
  ];

  beforeEach(async () => {
    mockProductRepo = {
      findAll: jest.fn(),
      searchByName: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: REPOSITORY_TOKENS.Product,
          useValue: mockProductRepo,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      mockProductRepo.findAll.mockResolvedValue(mockProducts);

      const result = await controller.findAll();

      expect(mockProductRepo.findAll).toHaveBeenCalled();
      expect(result).toBe(mockProducts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no products exist', async () => {
      mockProductRepo.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    it('should search products by name with valid query', async () => {
      const searchResults = [mockProducts[0]];
      mockProductRepo.searchByName.mockResolvedValue(searchResults);

      const result = await controller.search('test', 1, 10);

      expect(mockProductRepo.searchByName).toHaveBeenCalledWith('test', {
        skip: 0,
        take: 10,
        order: { name: 'ASC' },
      });
      expect(result).toBe(searchResults);
    });

    it('should handle pagination correctly', async () => {
      const searchResults = [mockProducts[1]];
      mockProductRepo.searchByName.mockResolvedValue(searchResults);

      const result = await controller.search('product', 2, 5);

      expect(mockProductRepo.searchByName).toHaveBeenCalledWith('product', {
        skip: 5, // (2-1) * 5
        take: 5,
        order: { name: 'ASC' },
      });
      expect(result).toBe(searchResults);
    });

    it('should return empty array for query too short', async () => {
      const result = await controller.search('a', 1, 10);

      expect(mockProductRepo.searchByName).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array for empty query', async () => {
      const result = await controller.search('', 1, 10);

      expect(mockProductRepo.searchByName).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await controller.search('   ', 1, 10);

      expect(mockProductRepo.searchByName).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should trim query string', async () => {
      const searchResults = [mockProducts[0]];
      mockProductRepo.searchByName.mockResolvedValue(searchResults);

      const result = await controller.search('  test  ', 1, 10);

      expect(mockProductRepo.searchByName).toHaveBeenCalledWith('test', {
        skip: 0,
        take: 10,
        order: { name: 'ASC' },
      });
      expect(result).toBe(searchResults);
    });

    it('should use default pagination values when not provided', async () => {
      const searchResults = mockProducts;
      mockProductRepo.searchByName.mockResolvedValue(searchResults);

      const result = await controller.search('test');

      expect(mockProductRepo.searchByName).toHaveBeenCalledWith('test', {
        skip: 0, // (1-1) * 20
        take: 20,
        order: { name: 'ASC' },
      });
      expect(result).toBe(searchResults);
    });

    it('should handle invalid page and limit values', async () => {
      const searchResults = [mockProducts[0]];
      mockProductRepo.searchByName.mockResolvedValue(searchResults);

      const result = await controller.search('test', NaN, NaN);

      expect(mockProductRepo.searchByName).toHaveBeenCalledWith('test', {
        skip: NaN, // NaN stays NaN
        take: NaN, // NaN stays NaN
        order: { name: 'ASC' },
      });
      expect(result).toBe(searchResults);
    });
  });
});
