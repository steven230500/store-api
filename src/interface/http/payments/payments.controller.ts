import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Response } from 'express';
import { CreatePendingTransactionUC } from '../../../application/use-cases/create-pending-transaction.uc';
import { ProcessPaymentWithWompiUC } from '../../../application/use-cases/process-payment-with-wompi.uc';
import { FinalizeTransactionUC } from '../../../application/use-cases/finalize-transaction.uc';
import {
  CURRENCY,
  PAYMENT_STATUS,
  type PaymentStatus,
} from '../../../domain/constants/payment-status';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';
import type { TransactionRepository } from '../../../domain/repositories/transaction.repository';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPending: CreatePendingTransactionUC,
    private readonly processPayment: ProcessPaymentWithWompiUC,
    private readonly finalizeTx: FinalizeTransactionUC,
    @Inject('PaymentGateway')
    private readonly gateway: {
      getTransactionStatus: (ref: string) => Promise<PaymentStatus>;
    },
    @Inject(REPOSITORY_TOKENS.Transaction)
    private readonly txRepo: TransactionRepository,
  ) {}

  @Post('checkout')
  @HttpCode(200)
  async checkout(@Body() dto: CheckoutDto) {
    try {
      console.log('PAYMENT_CHECKOUT_START=', JSON.stringify(dto));

      const pending = await this.createPending.execute({
        productId: dto.productId,
        amountInCents: dto.amountInCents,
        currency: CURRENCY.COP,
      });
      console.log('PAYMENT_PENDING_CREATED=', JSON.stringify(pending));

      const result = await this.processPayment.execute({
        amountInCents: dto.amountInCents,
        email: dto.email,
        card: dto.card,
        reference: pending.reference,
        installments: dto.installments,
      });
      console.log('PAYMENT_WOMPI_RESULT=', JSON.stringify(result));

      const finalized = await this.finalizeTx.execute({
        transactionId: pending.id,
        status: result.status,
        productId: dto.productId,
      });
      console.log('PAYMENT_FINALIZED=', JSON.stringify(finalized));

      return { transaction: finalized, wompi: result };
    } catch (error) {
      console.error('PAYMENT_CHECKOUT_ERROR=', error);
      throw error;
    }
  }

  @Get(':reference/status')
  async transactionStatus(
    @Param('reference') reference: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const tx = await this.txRepo.findByReference(reference);
    if (!tx) {
      res
        .status(404)
        .write(
          `data: ${JSON.stringify({ error: 'Transaction not found' })}\n\n`,
        );
      res.end();
      return;
    }

    const initialData = `data: ${JSON.stringify({
      type: 'initial',
      transaction: tx,
      timestamp: new Date().toISOString(),
    })}\n\n`;
    res.write(initialData);

    const poll = async () => {
      try {
        const currentStatus =
          await this.gateway.getTransactionStatus(reference);

        if (currentStatus !== PAYMENT_STATUS.PENDING) {
          const finalizedTx = await this.finalizeTx.execute({
            transactionId: tx.id,
            status: currentStatus,
            productId: tx.productId,
          });

          const data = `data: ${JSON.stringify({
            type: 'status_update',
            transaction: finalizedTx,
            status: currentStatus,
            timestamp: new Date().toISOString(),
          })}\n\n`;
          res.write(data);
          res.end();
          return;
        }

        setTimeout(() => void poll(), 1000);
      } catch (error) {
        console.error('Error polling transaction status:', error);
        setTimeout(() => void poll(), 1000);
      }
    };

    void poll();

    res.on('close', () => {
      // Cleanup
    });
  }
}
