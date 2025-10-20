import {
  Controller,
  Post,
  HttpCode,
  Req,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { FinalizeTransactionUC } from '../../../application/use-cases/finalize-transaction.uc';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';
import type { TransactionRepository } from '../../../domain/repositories/transaction.repository';

import type { PaymentStatus } from '../../../domain/constants/payment-status';

interface WompiTransaction {
  id: string;
  status: PaymentStatus;
  reference: string;
}

interface WompiEventData {
  transaction: WompiTransaction;
}

interface WompiEvent {
  event: string;
  data: WompiEventData;
}

@Controller('payments/wompi')
export class WompiEventsController {
  constructor(
    private readonly finalize: FinalizeTransactionUC,
    @Inject(REPOSITORY_TOKENS.Transaction)
    private readonly txRepo: TransactionRepository,
  ) {}

  @Post('transactions')
  @HttpCode(200)
  async handle(@Req() req: Request & { rawBody?: Buffer }) {
    const secret = process.env.WOMPI_EVENTS_KEY!;
    const signature = String(req.headers['x-wompi-signature'] || '');
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const calc = createHmac('sha256', secret).update(raw).digest('hex');

    if (
      !signature ||
      !timingSafeEqual(Buffer.from(calc), Buffer.from(signature))
    ) {
      throw new UnauthorizedException('Invalid event signature');
    }

    const evt = JSON.parse(raw.toString('utf8')) as WompiEvent;
    const tx = evt.data.transaction;

    if (!tx.reference || !tx.status) return { ok: true };

    // Idempotencia: intenta insertar event_id
    const isProcessed = await this.txRepo.markEventProcessed(tx.id);
    if (!isProcessed) return { ok: true }; // Ya procesado

    // Buscar transacción por reference
    const transaction = await this.txRepo.findByReference(tx.reference);
    if (!transaction) return { ok: true };

    // Finalizar
    await this.finalize.execute({
      transactionId: transaction.id,
      status: tx.status,
      productId: transaction.productId,
    });

    return { ok: true };
  }
}
