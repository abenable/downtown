import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260105154027 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" drop column if exists "status";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "review" add column if not exists "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending';`);
  }

}
