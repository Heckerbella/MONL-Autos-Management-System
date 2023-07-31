import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";

class EstimateController {
    async createEstimate (req: Request, res: Response) {
        const {
            job_type_id,
            amount,
            vehicle_id,
            description,
            customer_id
        } = req.body

        if (
            !amount ||
            !customer_id ||
            !vehicle_id ||
            !job_type_id
        ) {
            return res.status(400).json({ error_code: 400, msg: 'Missing information.' });
        }

        try {
            const customer = await db.customer.findUnique({where: {id: parseInt(customer_id, 10)}})

            if (!customer) return res.status(404).json({ error_code: 404, msg: 'Customer not found.' });
            const vehicle = await db.vehicle.findFirst({where: {ownerID: customer.id}})
            if (!vehicle) return res.status(404).json({ error_code: 404, msg: "Vehicle not found or vehichle doesn't belong to customer."})
            const estimate = await db.estimate.create({
                data: {
                    customerID: parseInt(customer_id, 10),
                    jobTypeID: parseInt(job_type_id, 10),
                    vehicleID: parseInt(vehicle_id, 10),
                    amount: parseFloat(amount),
                    description,
                }
            })
            res.status(201).json({data: estimate, msg: "Estimate created successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not create estimate.' });
        }
    }

    async getEstimates (req: Request, res: Response) {
        try {
            const estimates = await db.estimate.findMany();
            res.status(200).json({data: estimates, msg: "Estimates retrieved successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not retrieve estimates.' });
        }
    }

    async getEstimate (req: Request, res: Response) {
        const { id } = req.params;
        try {
            const estimate = await db.estimate.findUnique({ 
                where: { id: parseInt(id, 10) },
                select: {
                    id: true,
                    estimateNo: true,
                    createdAt: true,
                    description: true,
                    amount: true,
                    customer: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            billingAddress: true,
                            companyContact: true,
                            companyName: true
                        }
                    }
                }
             });
            if (!estimate) {
                return res.status(404).json({ error_code: 404, msg: 'Estimate not found.' });
            }
            res.status(200).json({data: estimate, msg: "Estimate retrieved successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not retrieve estimate.' });
        }
    }

    async updateEstimate (req: Request, res: Response) {
        const { id } = req.params;
        const {
            amount,
            description,
        } = req.body
        
        try {
            const estimate = await db.estimate.findUnique({where: {id: parseInt(id, 10)}})

            if (!estimate) return res.status(404).json({ error_code: 404, msg: 'Estimate not found.' });
            const data: {[key: string]: number | string} = {}
    
            if (amount) data['amount'] = parseFloat(amount)
            if (description) data['description'] = description

            const updatedEstimate = await db.estimate.update({
                where: {id: parseInt(id, 10)},
                data
            })
            res.status(200).json({data: updatedEstimate, msg: "Estimate updated successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not update estimate.' });
        }
    }


    async deleteEstimate (req: Request, res: Response) {
        const { id } = req.params;
        try {
            const estimate = await db.estimate.findUnique({where: {id: parseInt(id, 10)}})

            if (!estimate) return res.status(404).json({ error_code: 404, msg: 'Estimate not found.' });
            await db.estimate.delete({where: {id: parseInt(id, 10)}})
            res.status(200).json({msg: "Estimate deleted successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not delete estimate.' });
        }
    } 
}

const estimateController = new EstimateController();
export default estimateController;
