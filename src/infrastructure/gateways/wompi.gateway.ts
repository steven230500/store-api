import axios, { AxiosInstance } from 'axios';
import { createHash } from 'crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGateway } from '../../domain/services/payment-gateway.port';
import {
  PAYMENT_STATUS,
  type PaymentStatus,
  ERROR_MESSAGES,
  Currency,
} from '../../domain/constants/payment-status';

type WompiCardTokenType = 'CARD';
type WompiCurrency = 'COP';

interface WompiMerchantResponse {
  data: {
    presigned_acceptance: {
      acceptance_token: string;
    };
  };
}

interface WompiTokenizeResponse {
  data: {
    id: string;
    type: WompiCardTokenType;
    last_four?: string;
  };
}

type WompiTxnStatus =
  | 'APPROVED'
  | 'DECLINED'
  | 'ERROR'
  | 'PENDING'
  | 'VOIDED'
  | 'REFUNDED';

interface WompiTransactionResponse {
  data: {
    id: string;
    status: WompiTxnStatus;
    reference: string;
  };
}

export interface TokenizeCardDto {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

export interface ChargeDto {
  amount_in_cents: number;
  currency: WompiCurrency;
  customer_email: string;
  token?: string;
  reference: string;
  installments?: number;
}

export interface ChargeResult {
  status: PaymentStatus;
  external_id?: string;
  raw: unknown;
}

@Injectable()
export class WompiGateway implements PaymentGateway {
  private readonly base: string;
  private readonly pub: string;
  private readonly prv: string;
  private readonly http: AxiosInstance;

  private buildIntegrity(
    reference: string,
    amountInCents: number,
    currency: Currency,
  ): string {
    const integrityKey = this.cfg.get<string>('WOMPI_INTEGRITY_KEY');
    if (!integrityKey) {
      throw new InternalServerErrorException(
        ERROR_MESSAGES.WOMPI_INTEGRITY_KEY_MISSING,
      );
    }
    const plain = `${reference}${amountInCents}${currency}${integrityKey}`;
    console.log('WOMPI_SIGN_INPUT=', plain);
    const signature = createHash('sha256').update(plain, 'utf8').digest('hex');
    console.log('WOMPI_SIGNATURE=', signature);
    return signature;
  }

  constructor(private readonly cfg: ConfigService) {
    const base = this.cfg.get<string>('WOMPI_BASE_URL');
    const pub = this.cfg.get<string>('WOMPI_PUBLIC_KEY');
    const prv = this.cfg.get<string>('WOMPI_PRIVATE_KEY');

    if (!base || !pub || !prv) {
      throw new InternalServerErrorException(
        ERROR_MESSAGES.WOMPI_CONFIG_MISSING,
      );
    }

    this.base = base;
    this.pub = pub;
    this.prv = prv;

    this.http = axios.create({
      baseURL: this.base,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async getAcceptanceToken(): Promise<string> {
    const url = `/merchants/${this.pub}`;
    const { data } = await this.http.get<WompiMerchantResponse>(url);
    const token = data?.data?.presigned_acceptance?.acceptance_token;

    if (!token) {
      throw new InternalServerErrorException(
        ERROR_MESSAGES.WOMPI_ACCEPTANCE_TOKEN_MISSING,
      );
    }

    return token;
  }

  async tokenizeCard(dto: TokenizeCardDto): Promise<{ token: string }> {
    const { data } = await this.http.post<WompiTokenizeResponse>(
      '/tokens/cards',
      dto,
      { headers: { Authorization: `Bearer ${this.pub}` } },
    );

    return { token: data.data.id };
  }

  async charge(dto: ChargeDto): Promise<ChargeResult> {
    const acceptance_token = await this.getAcceptanceToken();

    const payload = {
      amount_in_cents: dto.amount_in_cents,
      currency: dto.currency as 'COP',
      customer_email: dto.customer_email,
      acceptance_token,
      payment_method: {
        type: 'CARD' as const,
        token: dto.token,
        installments: dto.installments ?? 1,
      },
      reference: dto.reference,
    } as const;

    const signature = this.buildIntegrity(
      payload.reference,
      payload.amount_in_cents,
      payload.currency,
    );

    const payloadWithSig = { ...payload, signature };

    try {
      const { data } = await this.http.post<WompiTransactionResponse>(
        '/transactions',
        payloadWithSig,
        { headers: { Authorization: `Bearer ${this.prv}` } },
      );

      const wompiStatus = data.data.status ?? 'ERROR';
      const status: PaymentStatus =
        wompiStatus === 'APPROVED'
          ? PAYMENT_STATUS.APPROVED
          : wompiStatus === 'DECLINED'
            ? PAYMENT_STATUS.DECLINED
            : wompiStatus === 'PENDING'
              ? PAYMENT_STATUS.PENDING
              : PAYMENT_STATUS.ERROR;

      return {
        status,
        external_id: data.data.id,
        raw: data,
      };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return {
          status: PAYMENT_STATUS.ERROR,
          raw: err.response?.data ?? err.message,
        };
      }
      return {
        status: PAYMENT_STATUS.ERROR,
        raw: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
