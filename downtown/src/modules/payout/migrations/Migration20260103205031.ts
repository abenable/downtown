import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260103205031 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payout" ("id" text not null, "vendor_id" text not null, "amount" numeric not null, "currency_code" text not null default 'ugx', "period_start" timestamptz not null, "period_end" timestamptz not null, "orders_count" integer not null default 0, "total_sales" numeric not null, "total_commission" numeric not null, "status" text check ("status" in ('pending', 'processing', 'completed', 'failed')) not null default 'pending', "processed_at" timestamptz null, "reference" text null, "notes" text null, "raw_amount" jsonb not null, "raw_total_sales" jsonb not null, "raw_total_commission" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_deleted_at" ON "payout" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payout" cascade;`);
  }

}
