import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";
import { generateUniqueId } from "../utils/general";
import { addSubscriberToTopic } from "../utils/novuModule";

class UserController {
    async createUser (req: Request, res: Response) {
        const { email, password, detokenizedRole } = req.body;

        const role = await db.role.findUnique({where: {id: detokenizedRole}})

        if (role && role.name == "admin") {
            try {
                if (email && password) {
                    let user = await db.user.findUnique({where : { email}})

                    if (user) return res.status(400).json({ error_code: 400, msg: 'User already exists.' })

                    let subID = generateUniqueId()
                    while ((await db.user.findUnique({where: {subscriberID: subID}}))) {
                        subID = generateUniqueId()
                    }
    
                     user = await db.user.create({data: {
                        email: email as string,
                        password: Buffer.from(password as string, 'utf8').toString("base64"),
                        subscriberID: subID,
                        roleID: 2
                    }})
            
                    if (user) {
                        // decode password
                        user.password = Buffer.from(user.password, 'base64').toString('utf8');
                        await (user.subscriberID && addSubscriberToTopic([user.subscriberID]))
                        res.status(201).json({data: user, msg: "User created successfully."});
                    } else {
                        res.status(400).json({ error_code: 400, msg: 'Could not create user.'});
                    }
                } else {
                    res.status(400).json({error_code: 400, msg: 'Missing information.'});
                }                
            } catch (error) {
                return res.status(500).json({error_code: 500, msg: 'Internal server error.'})
            }

        } else {
            res.status(401).json({error_code: 401, msg: 'You are not authorized to create a user.'});
        }
    }

    async getUsers (req: Request, res: Response) {

        const {detokenizedRole} = req.body
        const role = await db.role.findUnique({where: {id: detokenizedRole}})

        if (role && role.name == "admin") {
            const users = await db.user.findMany({
                where: {
                    NOT: {
                        roleID: 1
                    }
                },
                select: {
                    id: true,
                    email: true,
                    roleID: true,
                    role: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    id: 'asc'
                }
            });
            res.status(200).json({data: users});
        } else {
            res.status(401).json({error_code: 401, msg: 'You are not authorized to create a user.'});
        }
    }

    async getUser (req: Request, res: Response) {

        const {detokenizedRole } = req.body
        const {id} = req.params
        const role = await db.role.findUnique({where: {id: detokenizedRole}})

        if (role && role.name == "admin") {

            if (id) {
                const user = await db.user.findUnique({
                    where: {
                        id: parseInt(id, 10)
                    },
                    select: {
                        id: true,
                        email: true,
                        roleID: true,
                        role: {
                            select: {
                                name: true
                            }
                        }
                    }
                });
                res.status(200).json({data: user});
            } else {
                res.status(400).json({error_code: 400, msg: 'Missing information: Please provide user id parameter.'});
            }
        } else {
            res.status(401).json({error_code: 401, msg: 'You are not authorized to create a user.'});
        }
    }

    async getMe (req: Request, res: Response) {

        const {detokenizedEmail } = req.body
        try {  
            const user =  await db.user.findUnique({where: {email: detokenizedEmail},
                select: {
                    id: true,
                    email: true,
                    roleID: true,
                    role: {
                        select: {
                            name: true
                        }
                    }
                }
            })
            
            res.status(200).json({data: user});
        } catch (error) {
            res.status(500).json({error_code: 500, msg: 'Internal server error.'})
        }
    }

    async updateUser(req: Request, res: Response) {
        const {detokenizedEmail, password } = req.body
        
        const user = await db.user.findUnique({where: {email: detokenizedEmail}})

        if (!user) return res.status(404).json({ error_code: 404, msg: 'User not found.' });
        const data: {[key: string]: string | number} = {}
        if (password) {
            data.password = Buffer.from(password as string, 'utf8').toString("base64");
        }

        const updatedUser = await db.user.update({
            where: {email: detokenizedEmail},
            data
        })

        if (updatedUser) {
            // decode password
            // updatedUser.password = Buffer.from(updatedUser.password, 'base64').toString('utf8');
            res.status(200).json({msg: "User password successfully."});
        } else {
            res.status(400).json({ error_code: 400, msg: 'Could not update user.'});
        }
    }

        async getUserRoles (req: Request, res: Response) {
        try {
            const userRoles = await db.role.findMany({
                orderBy: {
                    id: 'asc'
                }
            });
            res.status(200).json({data: userRoles});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not get user roles.' });
        }
    }
}

const userController = new UserController();
export default userController;
