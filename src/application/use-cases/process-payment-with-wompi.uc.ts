import { Injectable, Inject } from '@nestjs/common';
import type { PaymentGateway } from '../../domain/services/payment-gateway.port';
import { CURRENCY } from '../../domain/constants/payment-status';

@Injectable()
export class ProcessPaymentWithWompiUC {
  constructor(
    @Inject('PaymentGateway') private readonly gateway: PaymentGateway,
  ) {}

  async execute(input: {
    amountInCents: number;
    email: string;
    card: {
      number: string;
      cvc: string;
      exp_month: string;
      exp_year: string;
      card_holder: string;
    };
    reference: string;
    installments?: number;
  }) {
    const { token } = await this.gateway.tokenizeCard(input.card);
    return this.gateway.charge({
      amount_in_cents: input.amountInCents, // ya viene en centavos desde el controller
      currency: CURRENCY.COP,
      customer_email: input.email,
      token,
      reference: input.reference,
      installments: input.installments,
    });
  }
}
