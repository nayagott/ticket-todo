CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'Backlog' NOT NULL,
	"priority" varchar(10),
	"order" integer NOT NULL,
	"started_at" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_tickets_status_order" ON "tickets" USING btree ("status","order");--> statement-breakpoint
CREATE INDEX "idx_tickets_due_date" ON "tickets" USING btree ("due_date");