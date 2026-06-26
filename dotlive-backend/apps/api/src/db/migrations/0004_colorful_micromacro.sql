CREATE TABLE IF NOT EXISTS "token_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"actor_email" text,
	"operation" text NOT NULL,
	"from_user_id" text,
	"to_user_id" text,
	"amount_dot" numeric(20, 2) NOT NULL,
	"reason" text NOT NULL,
	"related_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_supply" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"max_supply_dot" numeric(20, 2) DEFAULT '100000000000' NOT NULL,
	"total_minted_dot" numeric(20, 2) DEFAULT '500' NOT NULL,
	"total_burned_dot" numeric(20, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_ops_actor_idx" ON "token_operations" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_ops_from_idx" ON "token_operations" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_ops_to_idx" ON "token_operations" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_ops_op_idx" ON "token_operations" USING btree ("operation","created_at");