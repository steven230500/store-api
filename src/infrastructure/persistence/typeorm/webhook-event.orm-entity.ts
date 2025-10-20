import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('webhook_events')
export class WebhookEventOrmEntity {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn()
  created_at: Date;
}
