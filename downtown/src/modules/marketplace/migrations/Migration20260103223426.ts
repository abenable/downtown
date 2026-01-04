import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260103223426 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor_admin" add column if not exists "customer_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor_admin" drop column if exists "customer_id";`);
  }

}
