import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260103224647 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor" add column if not exists "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', add column if not exists "rejection_reason" text null, add column if not exists "approved_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor" drop column if exists "status", drop column if exists "rejection_reason", drop column if exists "approved_at";`);
  }

}
