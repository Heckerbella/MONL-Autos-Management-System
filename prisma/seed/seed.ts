// import { PrismaClient } from "@prisma/client";
import { db } from "../../src/utils/prismaClient";
import { user, roles, customerTypes } from "./data";


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

    await db.user.create({
        data: user
    });

}

seed()
  .catch((e) => console.error(e))
  .finally(async () => {
    await db.$disconnect();
});