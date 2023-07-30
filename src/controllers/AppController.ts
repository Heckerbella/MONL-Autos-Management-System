import { db } from "../utils/prismaClient";
import { Request, Response } from "express";

class AppController {
    async getStatus(req: Request, res: Response) {
        let dbStatus = false
        try {
            await db.$connect()
            await db.user.findMany()
            dbStatus = true
        } catch (error) {
            dbStatus = false
        }

        res.status(200).json({ db: dbStatus })
    }
}

const appController = new AppController();
export default appController;
