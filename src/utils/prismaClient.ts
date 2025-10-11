import { PrismaClient } from "@prisma/client";

let db: PrismaClient;

declare global {
    var __db: PrismaClient | undefined;
}

if (!global.__db) {
    //global.__db = new PrismaClient();
    global.__db = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'] // Enable logging for queries, info, warnings, and errors
    });
}

db = global.__db;

export { db };
