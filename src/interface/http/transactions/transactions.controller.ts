import { Controller, Get, Param, Res } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Response } from 'express';
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

  @Get(':id/events')
  async sse(@Param('id') id: string, @Res() res: Response) {
    // Headers SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Verificar que la transacción existe
    const tx = await this.txRepo.findById(id);
    if (!tx) {
      res
        .status(404)
        .write(
          `data: ${JSON.stringify({ error: 'Transaction not found' })}\n\n`,
        );
      res.end();
      return;
    }

    // Registrar cliente
    this.clients.set(id, res);

    // Enviar estado inicial
    const initialData = `data: ${JSON.stringify({
      type: 'initial',
      transaction: tx,
      timestamp: new Date().toISOString(),
    })}\n\n`;
    res.write(initialData);

    // Cleanup cuando se desconecta
    res.on('close', () => {
      this.clients.delete(id);
    });

    // Mantener conexión viva con heartbeat cada 30s
    const heartbeat = setInterval(() => {
      if (!res.destroyed) {
        res.write(
          `data: ${JSON.stringify({
            type: 'heartbeat',
            transactionId: id,
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
      }
    }, 30000);

    // Cleanup interval cuando se cierra
    res.on('finish', () => {
      clearInterval(heartbeat);
    });
  }

  // Método para notificar cambios de estado
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
      client.end(); // Cerrar conexión después de enviar update
    }
  }
}
