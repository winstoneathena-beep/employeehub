import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit runs outside Next.js, so it doesn't have access to our
// lib/env.ts loader. Read .env.local directly for migration commands.
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set in .env.local before running drizzle-kit.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Verbose output makes the push diff easier to scan in a small team.
  verbose: true,
  strict: true,
});
