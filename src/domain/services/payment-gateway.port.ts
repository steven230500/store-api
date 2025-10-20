import type { PaymentStatus, Currency } from '../constants/payment-status';

export interface PaymentGateway {
  tokenizeCard(payload: {
    number: string;
    cvc: string;
    exp_month: string;
    exp_year: string;
    card_holder: string;
  }): Promise<{ token: string }>;

  charge(payload: {
    amount_in_cents: number;
    currency: Currency;
    customer_email: string;
    payment_source_id?: string;
    token?: string;
    reference: string;
    installments?: number;
  }): Promise<{
    status: PaymentStatus;
    external_id?: string;
    raw: unknown;
  }>;
}
