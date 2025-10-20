import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreatePendingTransactionUC } from '../../../application/use-cases/create-pending-transaction.uc';
import { ProcessPaymentWithWompiUC } from '../../../application/use-cases/process-payment-with-wompi.uc';
import { FinalizeTransactionUC } from '../../../application/use-cases/finalize-transaction.uc';
import { CURRENCY } from '../../../domain/constants/payment-status';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPending: CreatePendingTransactionUC,
    private readonly processPayment: ProcessPaymentWithWompiUC,
    private readonly finalizeTx: FinalizeTransactionUC,
  ) {}

  @Post('checkout')
  @HttpCode(200)
  async checkout(@Body() dto: CheckoutDto) {
    // 1) Crear transacción PENDING y número interno
    const pending = await this.createPending.execute({
      productId: dto.productId,
      amountInCents: dto.amountInCents,
      currency: CURRENCY.COP,
    });

    // 2) Llamar Wompi
    const result = await this.processPayment.execute({
      amountInCents: dto.amountInCents,
      email: dto.email,
      card: dto.card,
      reference: pending.reference,
      installments: dto.installments,
    });

    // 3) Actualizar estado + asignar producto + descontar stock
    const finalized = await this.finalizeTx.execute({
      transactionId: pending.id,
      status: result.status,
      productId: dto.productId,
    });

    return { transaction: finalized, wompi: result };
  }
}
