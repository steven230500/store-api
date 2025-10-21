import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let mockFindAll: jest.MockedFunction<() => Promise<any[]>>;

  beforeEach(async () => {
    mockFindAll = jest.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Test Category',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            findAll: mockFindAll,
          },
        },
        {
          provide: REPOSITORY_TOKENS.Product,
          useValue: {
            findByCategory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return categories', async () => {
    const result = await controller.getAll();
    expect(mockFindAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});
