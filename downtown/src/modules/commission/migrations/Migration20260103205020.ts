import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260103205020 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "commission" ("id" text not null, "order_id" text not null, "vendor_id" text not null, "order_total" numeric not null, "commission_rate" integer not null default 10, "commission_amount" numeric not null, "vendor_amount" numeric not null, "currency_code" text not null default 'ugx', "status" text check ("status" in ('pending', 'collected', 'paid_out')) not null default 'pending', "collected_at" timestamptz null, "paid_out_at" timestamptz null, "raw_order_total" jsonb not null, "raw_commission_amount" jsonb not null, "raw_vendor_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "commission_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_deleted_at" ON "commission" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "commission" cascade;`);
  }

}
