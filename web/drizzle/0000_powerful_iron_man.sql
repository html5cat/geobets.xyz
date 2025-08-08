CREATE TABLE "bets" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"game_id" bigint NOT NULL,
	"player" varchar(42) NOT NULL,
	"amount_wei" bigint NOT NULL,
	"commit" varchar(66) NOT NULL,
	"commit_tx" varchar(66),
	"reveal_tx" varchar(66),
	"revealed_lat_e6" integer,
	"revealed_lon_e6" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" bigint PRIMARY KEY NOT NULL,
	"image_id" varchar(64) NOT NULL,
	"host_address" varchar(42) NOT NULL,
	"solution_commit" varchar(66) NOT NULL,
	"commit_deadline" bigint NOT NULL,
	"reveal_deadline" bigint NOT NULL,
	"secret" varchar(66) NOT NULL,
	"solution_lat_e6" integer NOT NULL,
	"solution_lon_e6" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"title" text,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"lat_e6" integer NOT NULL,
	"lon_e6" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"address" varchar(42) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
