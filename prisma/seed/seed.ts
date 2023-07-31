// import { PrismaClient } from "@prisma/client";
import { db } from "../../src/utils/prismaClient";
import { readExcelAndSeedDatabase } from "../../src/utils/seedJobMaterial";
import { user, roles, customerTypes, vehicleTypes, jobTypes } from "./data";


async function seed() {
    for (const role of roles) {
        await db.role.create({
            data: role
        });
    }

    for (const type of customerTypes) {
        await db.customerType.create({
            data: type
        });
    }

    for (const type of vehicleTypes) {
        await db.vehicleType.create({
            data: type
        });
    }

    for (const type of jobTypes) {
        await db.jobType.create({
            data: type
        })
    }

    await db.user.create({
        data: user
    });

    // Set the starting value of the auto-incremented InvoiceNo and EstimateNo to 100000
    await db.$queryRaw`ALTER SEQUENCE "Invoice_invoiceNo_seq" RESTART WITH 100000`;
    await db.$queryRaw`ALTER SEQUENCE "Estimate_estimateNo_seq" RESTART WITH 100000`;
    await readExcelAndSeedDatabase();

}

seed()
  .catch((e) => console.error(e))
  .finally(async () => {
    await db.$disconnect();
});