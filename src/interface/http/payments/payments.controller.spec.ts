import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { CreatePendingTransactionUC } from '../../../application/use-cases/create-pending-transaction.uc';
import { ProcessPaymentWithWompiUC } from '../../../application/use-cases/process-payment-with-wompi.uc';
import { FinalizeTransactionUC } from '../../../application/use-cases/finalize-transaction.uc';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: CreatePendingTransactionUC,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: 'test-tx-id',
              reference: 'TX-123',
              status: 'PENDING',
            }),
          },
        },
        {
          provide: ProcessPaymentWithWompiUC,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              status: 'APPROVED',
              wompiId: 'wompi-123',
            }),
          },
        },
        {
          provide: FinalizeTransactionUC,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: 'test-tx-id',
              status: 'APPROVED',
            }),
          },
        },
        {
          provide: 'PaymentGateway',
          useValue: {
            getTransactionStatus: jest.fn().mockResolvedValue('APPROVED'),
          },
        },
        {
          provide: REPOSITORY_TOKENS.Transaction,
          useValue: {
            findByReference: jest.fn().mockResolvedValue({
              id: 'test-tx-id',
              reference: 'TX-123',
              status: 'PENDING',
              productId: 'test-product',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should process checkout successfully', async () => {
    const dto = {
      productId: 'test-product',
      email: 'test@example.com',
      amountInCents: 10000,
      card: {
        number: '4111111111111111',
        cvc: '123',
        exp_month: '12',
        exp_year: '25',
        card_holder: 'Test User',
      },
      installments: 1,
    };

    const result = await controller.checkout(dto);

    expect(result).toHaveProperty('transaction');
    expect(result).toHaveProperty('wompi');
    expect(result.transaction.status).toBe('APPROVED');
  });
});
