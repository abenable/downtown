import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260103205044 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "support_ticket" ("id" text not null, "vendor_id" text not null, "subject" text not null, "message" text not null, "category" text check ("category" in ('order_issue', 'product_issue', 'payout_issue', 'account_issue', 'technical_issue', 'other')) not null default 'other', "priority" text check ("priority" in ('low', 'medium', 'high', 'urgent')) not null default 'medium', "status" text check ("status" in ('open', 'in_progress', 'resolved', 'closed')) not null default 'open', "order_id" text null, "admin_notes" text null, "resolution" text null, "resolved_at" timestamptz null, "resolved_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "support_ticket_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_deleted_at" ON "support_ticket" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "support_ticket" cascade;`);
  }

}
