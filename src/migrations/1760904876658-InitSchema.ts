import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1760904876658 implements MigrationInterface {
  name = 'InitSchema1760904876658';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "price_in_cents" integer NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'COP', "stock" integer NOT NULL DEFAULT 0, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" character varying NOT NULL, "status" character varying NOT NULL, "amount_in_cents" integer NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'COP', "product_id" character varying NOT NULL, "reference" character varying NOT NULL, "external_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dd85cc865e0c3d5d4be095d3f3" ON "transactions" ("reference")`,
    );
    await queryRunner.query(
      `CREATE TABLE "webhook_events" ("id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4cba37e6a0acb5e1fc49c34ebfd" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd85cc865e0c3d5d4be095d3f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "reference" character varying(80) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "UQ_dd85cc865e0c3d5d4be095d3f3f" UNIQUE ("reference")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9"`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`DROP TABLE "webhook_events"`);
  }
}
