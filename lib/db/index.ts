import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Drizzle ORM client backed by Neon's HTTP driver.
 *
 * Using the HTTP driver (not the WebSocket one) because Vercel serverless
 * functions are stateless — every cold start would open + close a WS,
 * adding ~100-300ms to first response. HTTP scales better for our use case
 * (admin pages, occasional webhooks; not high-throughput).
 */

// env.ts guarantees DATABASE_URL is a non-empty URL.
const sql = neon(env.DATABASE_URL);
export const db = drizzle({ client: sql, schema });

// Re-export the schema namespace so callers can do `db.select().from(users)`.
export * from "./schema";
