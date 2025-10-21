import { Controller, Get, Param, Res } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Response } from 'express';
import type { TransactionRepository } from '../../../domain/repositories/transaction.repository';
import { REPOSITORY_TOKENS } from '../../../domain/repositories/tokens';
import { ERROR_MESSAGES } from '../../../domain/constants/payment-status';

@Controller('transactions')
export class TransactionsController {
  private clients = new Map<string, Response>();

  constructor(
    @Inject(REPOSITORY_TOKENS.Transaction)
    private readonly txRepo: TransactionRepository,
  ) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    const tx = await this.txRepo.findById(id);
    if (!tx) throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    return tx;
  }

  @Get(':reference/events')
  async sse(@Param('reference') reference: string, @Res() res: Response) {
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

    this.clients.set(tx.id, res);

    const initialData = `data: ${JSON.stringify({
      type: 'initial',
      transaction: tx,
      timestamp: new Date().toISOString(),
    })}\n\n`;
    res.write(initialData);

    res.on('close', () => {
      this.clients.delete(tx.id);
    });

    const heartbeat = setInterval(() => {
      if (!res.destroyed) {
        // Enviar heartbeat con estado actual (sin consulta BD para evitar overhead)
        res.write(
          `data: ${JSON.stringify({
            type: 'heartbeat',
            transactionId: tx.id,
            currentStatus: tx.status, // Usar estado en memoria
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
      }
    }, 30000);

    res.on('finish', () => {
      clearInterval(heartbeat);
    });
  }

  notifyTransactionUpdate(
    transactionId: string,
    status: string,
    transaction?: Record<string, unknown>,
  ) {
    const client = this.clients.get(transactionId);
    if (client && !client.destroyed) {
      const data = `data: ${JSON.stringify({
        type: 'status_update',
        transactionId,
        status,
        transaction,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      client.write(data);
      client.end();
    }
  }
}
