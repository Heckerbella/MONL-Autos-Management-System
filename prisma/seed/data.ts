// import {Role, User, CustomerType} from "@prisma/client";
import { envs } from "../../src/utils/general"

const password = envs.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
const encodedpassword = Buffer.from(password as string, 'utf8').toString("base64")



export const user = {
    id: 1,
    email: 'admin@gmail.com',
    password: encodedpassword,
    roleID: 1
}

export const roles = [
    {
        id: 1,
        name: 'admin'
    },
    {
        id: 2,
        name: "user"
    }
]

export const customerTypes = [
    {
        id: 1,
        type: 'Corporate'
    },
    {
        id: 2,
        type: "Individual"
    }
]
