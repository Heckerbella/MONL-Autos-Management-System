import { Prisma } from "@prisma/client";
import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";
import { isValidDate } from "../utils/general";

class JobController {
    async getJobTypes (req: Request, res: Response) {
        try {
            const jobTypes = await db.jobType.findMany();
            res.status(200).json({data: jobTypes});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not get vehicle types.' });
        }
    }

    async createJob (req: Request, res: Response) {
        const {
            job_type_id,
            customer_id,
            vehicle_id,
            delivery_date
        } = req.body

        if (
            !job_type_id || 
            !customer_id ||
            !vehicle_id
        ) {
            return res.status(400).json({ error_code: 400, msg: 'Missing information.' });
        }

        if (delivery_date && !isValidDate(delivery_date)) return res.status(400).json({ error_code: 400, msg: 'Incorrect Date format for delivery_date. Please use the date format YYYY-MM-DD.' });

        try {
            const jobType = await db.jobType.findUnique({where: {id: parseInt(job_type_id, 10)}})
            const customer = await db.customer.findUnique({where: {id: parseInt(customer_id, 10)}})
            const vehicle = await db.vehicle.findUnique({where: {id: parseInt(vehicle_id, 10)}})

            if (!jobType) return res.status(404).json({ error_code: 404, msg: 'Job type not found.' });
            if (!customer) return res.status(404).json({ error_code: 404, msg: 'Customer not found.' });
            if (!vehicle) return res.status(404).json({ error_code: 404, msg: 'Vehicle not found.' });
            if (vehicle && vehicle.ownerID != customer.id) return res.status(400).json({ error_code: 400, msg: 'Vehicle does not belong to customer.' });

            const job = await db.job.create({
                data: {
                    jobTypeID: parseInt(job_type_id, 10),
                    customerID: parseInt(customer_id, 10),
                    vehicleID: parseInt(vehicle_id, 10),
                    deliveryDate: delivery_date ? (new Date(delivery_date)).toISOString() : null
                }
            })
            res.status(201).json({data: job, msg: "Job created successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not create job.' });
        }
    }

    async getJobs (req: Request, res: Response) {
        const {customerID}  = req.query;

        if (customerID && isNaN(parseInt(customerID as string, 10))) return res.status(400).json({ error_code: 400, msg: 'Invalid customer ID.' });
        const filterOptions: Prisma.JobWhereInput = customerID ? {customerID: parseInt(customerID as string, 10)} : {}
        try {
            const jobs = await db.job.findMany({
                where: filterOptions,
                select: {
                    id: true,
                    jobTypeID: true,
                    jobType: {
                        select: {
                            name: true
                        }
                    },
                    customerID: true,
                    customer: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    vehicleID: true,
                    vehicle: {
                        select: {
                            modelNo: true,
                            modelName: true,
                            licensePlate: true,
                            chasisNo: true,
                        }
                    },
                    deliveryDate: true
                }
            });
            res.status(200).json({data: jobs});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not get jobs.' });
        }
    }

    async getJob (req: Request, res: Response) {
        const { id } = req.params;
        try {
            const job = await db.job.findUnique({
                where: { id: parseInt(id, 10) },
                select: {
                    id: true,
                    jobTypeID: true,
                    jobType: {
                        select: {
                            name: true
                        }
                    },
                    customerID: true,
                    customer: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    vehicleID: true,
                    vehicle: {
                        select: {
                            modelNo: true,
                            modelName: true,
                            licensePlate: true,
                            chasisNo: true,
                        }
                    },
                    deliveryDate: true,
                    invoice: true,
                    estimate: true
                }
            });
            if (!job) {
                return res.status(404).json({ error_code: 404, msg: 'Job not found.' });
            }
            res.status(200).json({data: job});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not get job.' });
        }
    }

    async updateJob (req: Request, res: Response) {
        // async updateJob (req: Request, res: Response) {
        const { id } = req.params;
        const {delivery_date} = req.body;

        const job = await db.job.findUnique({where: {id: parseInt(id, 10)}})
        if (!job) {
            return res.status(404).json({ error_code: 404, msg: 'Job not found.' });
        }


        if (!isValidDate(delivery_date)) return res.status(400).json({ error_code: 400, msg: 'Invalid date. Please set date in the format YYYY-MM-DD' });

        try {
            const job = await db.job.update({
                where: {
                    id: parseInt(id, 10)
                },
                data: {
                    deliveryDate: (new Date(delivery_date)).toISOString()
                }
            })

            res.status(200).json({data: job, msg: "Job updated successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not update job.' });
        }
    }

    async deleteJob (req: Request, res: Response) {
        const {id} = req.params

        try {
            let job = await db.job.findUnique({
                where: {id: parseInt(id, 10)},
                select: {
                    invoice: true,
                    estimate: true
                }
            })

            if (!job) return res.status(400).json({ error_code: 400, msg: "Job not found."})

            if (job.invoice) return res.status(400).json({ error_code: 400, msg: "Job has an invoice. Please delete invoice first."})
            if (job.estimate) return res.status(400).json({ error_code: 400, msg: "Job has an estimate. Please delete estimate first."})
            const deletedJob = await db.job.delete({ where : {id: parseInt(id, 10)}})
            
            res.status(200).json({data: deletedJob, msg: "Job deleted successfully."});

        } catch (error) {
            console.log(error)
            res.status(500).json({error_code: 500, msg: "Internal server error."})
        }
    }
}

const jobController = new JobController();
export default jobController;