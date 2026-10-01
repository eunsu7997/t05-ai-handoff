CREATE TABLE `readings` (
	`scope` text NOT NULL,
	`signal` text NOT NULL,
	`date` text NOT NULL,
	`id` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`reading` text NOT NULL,
	`raw` text NOT NULL,
	`first_fetched` text NOT NULL,
	`last_fetched` text NOT NULL,
	PRIMARY KEY(`scope`, `signal`, `date`)
);
--> statement-breakpoint
CREATE TABLE `statuses` (
	`scope` text PRIMARY KEY NOT NULL,
	`freshness` text NOT NULL,
	`error` text NOT NULL,
	`attempted` text NOT NULL,
	`retry_after` real
);
