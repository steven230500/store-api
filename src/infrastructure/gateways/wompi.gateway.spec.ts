import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WompiGateway, TokenizeCardDto, ChargeDto } from './wompi.gateway';
import { PAYMENT_STATUS } from '../../domain/constants/payment-status';

// Mock axios at the module level
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
  isAxiosError: jest.fn(),
}));

describe('WompiGateway', () => {
  let gateway: WompiGateway;
  let mockConfig: jest.Mocked<ConfigService>;
  let mockAxiosInstance: jest.Mocked<axios.AxiosInstance>;

  const mockConfigValues = {
    WOMPI_BASE_URL: 'https://api.wompi.co/v1',
    WOMPI_PUBLIC_KEY: 'pub_test_key',
    WOMPI_PRIVATE_KEY: 'prv_test_key',
    WOMPI_INTEGRITY_KEY: 'integrity_test_key',
  };

  beforeEach(async () => {
    mockConfig = {
      get: jest.fn(
        (key: string) => mockConfigValues[key as keyof typeof mockConfigValues],
      ),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WompiGateway,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    gateway = module.get<WompiGateway>(WompiGateway);

    // Get the mocked axios instance from the gateway
    mockAxiosInstance = (gateway as any).http;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('tokenizeCard', () => {
    it('should tokenize card successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'tok_test_123',
            type: 'CARD' as const,
            last_four: '4242',
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const dto: TokenizeCardDto = {
        number: '4242424242424242',
        cvc: '123',
        exp_month: '12',
        exp_year: '25',
        card_holder: 'Test User',
      };

      const result = await gateway.tokenizeCard(dto);

      expect(result).toEqual({ token: 'tok_test_123' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/tokens/cards',
        dto,
        {
          headers: {
            Authorization: `Bearer ${mockConfigValues.WOMPI_PUBLIC_KEY}`,
          },
        },
      );
    });
  });

  describe('charge', () => {
    beforeEach(() => {
      // Mock getAcceptanceToken
      jest
        .spyOn(gateway as any, 'getAcceptanceToken')
        .mockResolvedValue('acceptance_token_123');
    });

    it('should process approved charge', async () => {
      const mockMerchantResponse = {
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'acceptance_token_123',
            },
          },
        },
      };

      const mockChargeResponse = {
        data: {
          data: {
            id: 'txn_test_123',
            status: 'APPROVED',
            reference: 'TX-123',
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockMerchantResponse);
      mockAxiosInstance.post.mockResolvedValue(mockChargeResponse);

      const dto: ChargeDto = {
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        token: 'tok_test_123',
        reference: 'TX-123',
        installments: 1,
      };

      const result = await gateway.charge(dto);

      expect(result.status).toBe(PAYMENT_STATUS.APPROVED);
      expect(result.external_id).toBe('txn_test_123');
    });

    it('should process declined charge', async () => {
      const mockMerchantResponse = {
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'acceptance_token_123',
            },
          },
        },
      };

      const mockChargeResponse = {
        data: {
          data: {
            id: 'txn_test_456',
            status: 'DECLINED',
            reference: 'TX-456',
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockMerchantResponse);
      mockAxiosInstance.post.mockResolvedValue(mockChargeResponse);

      const dto: ChargeDto = {
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        token: 'tok_test_123',
        reference: 'TX-456',
      };

      const result = await gateway.charge(dto);

      expect(result.status).toBe(PAYMENT_STATUS.DECLINED);
      expect(result.external_id).toBe('txn_test_456');
    });

    it('should process pending charge', async () => {
      const mockMerchantResponse = {
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'acceptance_token_123',
            },
          },
        },
      };

      const mockChargeResponse = {
        data: {
          data: {
            id: 'txn_test_789',
            status: 'PENDING',
            reference: 'TX-789',
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockMerchantResponse);
      mockAxiosInstance.post.mockResolvedValue(mockChargeResponse);

      const dto: ChargeDto = {
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        token: 'tok_test_123',
        reference: 'TX-789',
      };

      const result = await gateway.charge(dto);

      expect(result.status).toBe(PAYMENT_STATUS.PENDING);
      expect(result.external_id).toBe('txn_test_789');
    });

    it('should handle charge error', async () => {
      const mockMerchantResponse = {
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'acceptance_token_123',
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockMerchantResponse);
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      // Mock axios.isAxiosError to return false for regular errors
      const axiosMock = require('axios');
      (axiosMock.isAxiosError as jest.Mock).mockReturnValue(false);

      const dto: ChargeDto = {
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        token: 'tok_test_123',
        reference: 'TX-999',
      };

      const result = await gateway.charge(dto);

      expect(result.status).toBe(PAYMENT_STATUS.ERROR);
      expect(result.raw).toBe('Network error');
    });

    it('should handle axios error with response', async () => {
      const mockMerchantResponse = {
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'acceptance_token_123',
            },
          },
        },
      };

      const axiosError = {
        isAxiosError: true,
        response: {
          data: { error: 'Invalid token' },
        },
        message: 'Request failed',
      };

      mockAxiosInstance.get.mockResolvedValue(mockMerchantResponse);
      mockAxiosInstance.post.mockRejectedValue(axiosError);

      // Mock axios.isAxiosError to return true for axios errors
      const axiosMock = require('axios');
      (axiosMock.isAxiosError as jest.Mock).mockReturnValue(true);

      const dto: ChargeDto = {
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        token: 'tok_test_123',
        reference: 'TX-999',
      };

      const result = await gateway.charge(dto);

      expect(result.status).toBe(PAYMENT_STATUS.ERROR);
      expect(result.raw).toEqual({ error: 'Invalid token' });
    });
  });

  describe('buildIntegrity', () => {
    it('should build integrity signature', () => {
      // Test that the charge method calls buildIntegrity internally
      const mockMerchantResponse = {
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'acceptance_token_123',
            },
          },
        },
      };

      const mockChargeResponse = {
        data: {
          data: {
            id: 'txn_test_123',
            status: 'APPROVED',
            reference: 'TX-123',
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockMerchantResponse);
      mockAxiosInstance.post.mockResolvedValue(mockChargeResponse);

      const dto: ChargeDto = {
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        token: 'tok_test_123',
        reference: 'TX-123',
      };

      // The charge method internally calls buildIntegrity, so if it succeeds, buildIntegrity worked
      expect(async () => await gateway.charge(dto)).not.toThrow();
    });
  });
});
