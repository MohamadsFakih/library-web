/**
 * When DATABASE_URL is PostgreSQL (e.g. on Vercel), rewrite prisma/schema.prisma
 * to use provider = "postgresql". Local dev keeps SQLite.
 */
const fs = require("fs");
const path = require("path");

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    const m = content.match(/DATABASE_URL\s*=\s*["']?([^"'\s]+)/);
    if (m) return m[1].trim();
  }
  return "";
}

const url = getDatabaseUrl();
const usePostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");
if (!usePostgres) process.exit(0);

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");
schema = schema.replace(/provider\s*=\s*["']sqlite["']/, 'provider = "postgresql"');
fs.writeFileSync(schemaPath, schema);
