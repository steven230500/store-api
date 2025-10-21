import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductRepositoryImpl } from './product.repository.impl';
import { ProductOrmEntity } from './product.orm-entity';
import { Product } from '../../../domain/entities/product.entity';
import { CURRENCY } from '../../../domain/constants/payment-status';

describe('ProductRepositoryImpl', () => {
  let repository: ProductRepositoryImpl;
  let mockRepo: {
    find: jest.MockedFunction<() => Promise<ProductOrmEntity[]>>;
    findOne: jest.MockedFunction<
      (arg: { where: { id: string } }) => Promise<ProductOrmEntity | null>
    >;
    createQueryBuilder: jest.MockedFunction<() => any>;
    manager: {
      transaction: jest.MockedFunction<
        (callback: (tx: any) => Promise<void>) => Promise<void>
      >;
    };
  };

  const mockProductOrm: ProductOrmEntity = {
    id: 'product-1',
    name: 'Test Product',
    price_in_cents: 10000,
    currency: CURRENCY.COP,
    stock: 10,
    category: 'Test Category',
    category_id: 'category-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRepositoryImpl,
        {
          provide: getRepositoryToken(ProductOrmEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    repository = module.get<ProductRepositoryImpl>(ProductRepositoryImpl);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all products ordered by name', async () => {
      mockRepo.find.mockResolvedValue([mockProductOrm]);

      const result = await repository.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Product);
      expect(result[0].id).toBe('product-1');
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockProductOrm);

      const result = await repository.findById('product-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
      expect(result).toBeInstanceOf(Product);
      expect(result?.id).toBe('product-1');
    });

    it('should return null when product not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProductOrm]),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.findByCategory('category-1');

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'p.category_id = :categoryId',
        {
          categoryId: 'category-1',
        },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Product);
    });

    it('should apply pagination options', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProductOrm]),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await repository.findByCategory('category-1', {
        skip: 10,
        take: 5,
        order: { name: 'DESC' },
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith({ name: 'DESC' });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('searchByName', () => {
    it('should search products by name', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProductOrm]),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.searchByName('test');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(p.name) LIKE LOWER(:query)',
        { query: '%test%' },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Product);
    });
  });

  describe('decreaseStock', () => {
    it('should decrease stock successfully', async () => {
      const mockTxRepo = {
        findOne: jest.fn().mockResolvedValue(mockProductOrm),
        save: jest.fn(),
      };

      mockRepo.manager.transaction.mockImplementation(async (callback) => {
        await callback({
          getRepository: () => mockTxRepo,
        } as any);
      });

      await repository.decreaseStock('product-1', 2);

      expect(mockTxRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockTxRepo.save).toHaveBeenCalled();
    });

    it('should throw error if product not found', async () => {
      const mockTxRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };

      mockRepo.manager.transaction.mockImplementation(async (callback) => {
        await callback({
          getRepository: () => mockTxRepo,
        } as any);
      });

      await expect(repository.decreaseStock('non-existent', 1)).rejects.toThrow(
        'PRODUCT_NOT_FOUND',
      );
    });

    it('should throw error if insufficient stock', async () => {
      const mockTxRepo = {
        findOne: jest.fn().mockResolvedValue({ ...mockProductOrm, stock: 1 }),
        save: jest.fn(),
      };

      mockRepo.manager.transaction.mockImplementation(async (callback) => {
        await callback({
          getRepository: () => mockTxRepo,
        } as any);
      });

      await expect(repository.decreaseStock('product-1', 5)).rejects.toThrow(
        'OUT_OF_STOCK',
      );
    });
  });
});
