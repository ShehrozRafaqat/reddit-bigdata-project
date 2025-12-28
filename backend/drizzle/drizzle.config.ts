import type { Config } from "drizzle-kit";

export default {
  schema: "./backend/drizzle/schema.ts",
  out: "./backend/drizzle/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
