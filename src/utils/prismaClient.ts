import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env file if it exists
const result = dotenv.config();

// Check if .env file was found and loaded successfully
if (result.error) {
  console.error('.env file not found. Using environment variables directly.');
}

// Use DATABASE_URL from .env or environment variables
const DATABASE_URL = result.parsed?.DATABASE_URL || process.env.DATABASE_URL;

// Create Prisma client with the chosen DATABASE_URL
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

// export default prisma;



let db: PrismaClient;

declare global {
    var __db: PrismaClient | undefined;
}

if (!global.__db) {
    global.__db = prisma;
}

db = global.__db;

export { db };