import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { PaymentStatus } from '../../../domain/constants/payment-status';

@Entity('transactions')
export class TransactionOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: PaymentStatus;

  @Column({ type: 'int' })
  amount_in_cents!: number;

  @Column({ type: 'varchar', length: 3, default: 'COP' })
  currency!: 'COP';

  @Column({ type: 'varchar', length: 80 })
  product_id!: string;

  @Index({ unique: true })
  @Column()
  reference!: string; // número interno

  @Column({ type: 'varchar', length: 120, nullable: true })
  external_id!: string | null; // id en Wompi (opcional)

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
