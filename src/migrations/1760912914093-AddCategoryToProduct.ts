import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryToProduct1760912914093 implements MigrationInterface {
  name = 'AddCategoryToProduct1760912914093';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "category" character varying(50)`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "category" = 'Abarrotes' WHERE "category" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "category" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
  }
}
