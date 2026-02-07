import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(databaseUrl);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");

console.log("Running migration...");
try {
  await sql(schema);
  console.log("Migration completed successfully.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
