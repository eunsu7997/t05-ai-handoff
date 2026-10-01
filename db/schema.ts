import { sqliteTable, text, real, primaryKey } from "drizzle-orm/sqlite-core";
export const readings = sqliteTable("readings", {
 scope: text("scope").notNull(), signal: text("signal").notNull(), date: text("date").notNull(),
 id: text("id").notNull(), value: real("value").notNull(), unit: text("unit").notNull(),
 reading: text("reading").notNull(), raw: text("raw").notNull(), firstFetched: text("first_fetched").notNull(), lastFetched: text("last_fetched").notNull()
}, t => [primaryKey({columns:[t.scope,t.signal,t.date]})]);
export const statuses = sqliteTable("statuses", {scope:text("scope").primaryKey(), freshness:text("freshness").notNull(), error:text("error").notNull(), attempted:text("attempted").notNull(), retryAfter:real("retry_after")});
