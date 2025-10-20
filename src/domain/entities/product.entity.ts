import { Currency, ERROR_MESSAGES } from '../constants/payment-status';

export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public price_in_cents: number,
    public currency: Currency,
    public stock: number,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date(),
  ) {}

  hasStock(qty = 1): boolean {
    return this.stock >= qty;
  }

  decrease(qty = 1): void {
    if (!this.hasStock(qty)) throw new Error(ERROR_MESSAGES.OUT_OF_STOCK);
    this.stock -= qty;
    this.updated_at = new Date();
  }
}
