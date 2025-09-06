import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import dotenv from "dotenv";
dotenv.config();

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL value:", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

export const db = drizzle(pool, { schema });