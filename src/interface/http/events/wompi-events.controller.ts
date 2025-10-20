import {
  Controller,
  Post,
  HttpCode,
  Req,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { FinalizeTransactionUC } from '../../../application/use-cases/finalize-transaction.uc';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';
import type { TransactionRepository } from '../../../domain/repositories/transaction.repository';
import { TransactionsController } from '../transactions/transactions.controller';

// Interfaces para payload de Wompi (como en Go)
interface WompiSignature {
  properties: string[];
  checksum: string;
}

interface WompiTransaction {
  id: string;
  amount_in_cents: number;
  reference: string;
  customer_email: string;
  currency: string;
  payment_method_type: string;
  redirect_url: string;
  status: string;
  shipping_address?: string;
  payment_link_id?: string;
}

interface WompiData {
  transaction: WompiTransaction;
}

interface WompiWebhookPayload {
  event: string;
  data: WompiData;
  environment: string;
  signature: WompiSignature;
  timestamp: number;
  sent_at: string;
}

@Controller('payments/wompi')
export class WompiEventsController {
  constructor(
    private readonly finalize: FinalizeTransactionUC,
    @Inject(REPOSITORY_TOKENS.Transaction)
    private readonly txRepo: TransactionRepository,
    @Inject('TransactionsController')
    private readonly transactionsController: TransactionsController,
  ) {}

  @Post('transactions')
  @HttpCode(200)
  async handle(@Req() req: Request & { rawBody?: Buffer }) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));

    // Parsear payload de Wompi
    const payload = JSON.parse(raw.toString('utf8')) as WompiWebhookPayload;

    // Validar firma como en Go
    const isValid = this.validateWompiSignature(payload);
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const tx = payload.data.transaction;

    if (!tx.reference || !tx.status) return { ok: true };

    // Idempotencia: intenta insertar event_id
    const isProcessed = await this.txRepo.markEventProcessed(tx.id);
    if (!isProcessed) return { ok: true }; // Ya procesado

    // Buscar transacción por reference
    const transaction = await this.txRepo.findByReference(tx.reference);
    if (!transaction) return { ok: true };

    // Finalizar
    const finalizedTx = await this.finalize.execute({
      transactionId: transaction.id,
      status: tx.status as 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR',
      productId: transaction.productId,
    });

    // Notificar a clientes SSE conectados
    this.transactionsController.notifyTransactionUpdate(
      transaction.id,
      tx.status,
      finalizedTx as unknown as Record<string, unknown>,
    );

    return { ok: true };
  }

  private validateWompiSignature(payload: WompiWebhookPayload): boolean {
    const secret = process.env.WOMPI_EVENTS_KEY;
    if (!secret) return false;

    // Crear string concatenado como en Go
    const { data, timestamp } = payload;
    const tx = data.transaction;

    let concat = '';
    if (payload.event === 'transaction.updated') {
      concat = tx.id + tx.status + tx.amount_in_cents.toString();
    } else {
      return false; // Solo soportamos transaction.updated por ahora
    }

    concat += timestamp.toString();
    concat += secret;

    // Calcular SHA256
    const hash = createHash('sha256').update(concat).digest('hex');

    return hash === payload.signature.checksum;
  }
}
