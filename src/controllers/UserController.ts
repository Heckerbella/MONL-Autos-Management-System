import { User } from "@prisma/client";
import { db } from "../../src/utils/prismaClient";
import { Request, Response, NextFunction } from "express";

class UserController {
    async createUser (req: Request, res: Response) {
        const { email, password, detokenizedRole } = req.body;

        const role = await db.role.findUnique({where: {id: detokenizedRole}})

        if (role && role.name == "admin") {
            if (email && password) {
    
                const user = await db.user.create({data: {
                    email: email as string,
                    password: Buffer.from(password as string, 'utf8').toString("base64"),
                    roleID: 2
                }})
        
                if (user) {
                    // decode password
                    user.password = Buffer.from(user.password, 'base64').toString('utf8');
                    res.status(201).send(user);
                } else {
                    res.status(400).send('Could not create user');
                }
            } else {
                res.status(400).send('Missing information');
            }

        } else {
            res.status(401).send('You are not authorized to create a user');
        }
    }
}

const userController = new UserController();
export default userController;