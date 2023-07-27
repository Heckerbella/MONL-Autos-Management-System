import {Role, User, CustomerType} from "@prisma/client";
import { envs } from "../../src/server";

const password = envs.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
const encodedpassword = Buffer.from(password as string, 'utf8').toString("base64")



export const user: User = {
    id: 1,
    email: 'admin@gmail.com',
    password: encodedpassword,
    roleID: 1
}

export const roles: Role[] = [
    {
        id: 1,
        name: 'admin'
    },
    {
        id: 2,
        name: "user"
    }
]

export const customerTypes: CustomerType[] = [
    {
        id: 1,
        type: 'Corporate'
    },
    {
        id: 2,
        type: "Individual"
    }
]
