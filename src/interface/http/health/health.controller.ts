import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly ds: DataSource) {}

  @Get('liveness')
  getLive() {
    return { ok: true };
  }

  @Get('readiness')
  async getReady() {
    await this.ds.query('SELECT 1');
    return { ok: true };
  }
}
