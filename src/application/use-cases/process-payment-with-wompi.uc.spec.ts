import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPaymentWithWompiUC } from './process-payment-with-wompi.uc';

describe('ProcessPaymentWithWompiUC', () => {
  let useCase: ProcessPaymentWithWompiUC;

  const mockWompiGateway = {
    tokenizeCard: jest.fn().mockResolvedValue({ token: 'test-token' }),
    charge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentWithWompiUC,
        {
          provide: 'PaymentGateway',
          useValue: mockWompiGateway,
        },
      ],
    }).compile();

    useCase = module.get<ProcessPaymentWithWompiUC>(ProcessPaymentWithWompiUC);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should process payment successfully', async () => {
    const mockWompiResponse = {
      status: 'APPROVED',
      wompiId: 'wompi_tx_123',
    };

    mockWompiGateway.charge.mockResolvedValue(mockWompiResponse);

    const result = await useCase.execute({
      amountInCents: 10000,
      email: 'test@example.com',
      card: {
        number: '4111111111111111',
        cvc: '123',
        exp_month: '12',
        exp_year: '25',
        card_holder: 'Test User',
      },
      reference: 'TX-123',
      installments: 1,
    });

    expect(result).toEqual(mockWompiResponse);
    expect(mockWompiGateway.tokenizeCard).toHaveBeenCalledWith({
      number: '4111111111111111',
      cvc: '123',
      exp_month: '12',
      exp_year: '25',
      card_holder: 'Test User',
    });
    expect(mockWompiGateway.charge).toHaveBeenCalledWith({
      amount_in_cents: 10000,
      currency: 'COP',
      customer_email: 'test@example.com',
      token: 'test-token',
      reference: 'TX-123',
      installments: 1,
    });
  });

  it('should handle payment decline', async () => {
    const mockWompiResponse = {
      status: 'DECLINED',
      wompiId: 'wompi_tx_123',
    };

    mockWompiGateway.charge.mockResolvedValue(mockWompiResponse);

    const result = await useCase.execute({
      amountInCents: 10000,
      email: 'test@example.com',
      card: {
        number: '4111111111111111',
        cvc: '123',
        exp_month: '12',
        exp_year: '25',
        card_holder: 'Test User',
      },
      reference: 'TX-123',
      installments: 1,
    });

    expect(result.status).toBe('DECLINED');
  });

  it('should handle Wompi gateway errors', async () => {
    mockWompiGateway.tokenizeCard.mockRejectedValue(
      new Error('Wompi API error'),
    );

    await expect(
      useCase.execute({
        amountInCents: 10000,
        email: 'test@example.com',
        card: {
          number: '4111111111111111',
          cvc: '123',
          exp_month: '12',
          exp_year: '25',
          card_holder: 'Test User',
        },
        reference: 'TX-123',
        installments: 1,
      }),
    ).rejects.toThrow('Wompi API error');
  });
});
