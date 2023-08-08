import { JobStatus, Prisma } from "@prisma/client";
import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";
import { isValidDate } from "../utils/general";


function isValidJobStatus(status: string) {
    return Object.values(JobStatus).includes(status as JobStatus);
}


class Job  {
    async getJobTypes (req: Request, res: Response) {
        try {
            const jobTypes = await db.jobType.findMany({
                orderBy: {
                    id: 'asc'
                }
            });
            res.status(200).json({data: jobTypes});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not get job types.' });
        }
    }

    async createJob (req: Request, res: Response) {
        const {
            job_type_id,
            customer_id,
            vehicle_id,
            delivery_date,
            status
        } = req.body

        if (
            !job_type_id || 
            !customer_id ||
            !vehicle_id
        ) {
            return res.status(400).json({ error_code: 400, msg: 'Missing information.' });
        }



        if (delivery_date && !isValidDate(delivery_date)) return res.status(400).json({ error_code: 400, msg: 'Incorrect Date format for delivery_date. Please use the date format YYYY-MM-DD.' });

        if (status && !isValidJobStatus(status)) return res.status(400).json({ error_code: 400, msg: 'Invalid job status. Accepted values are: NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED' });
        try {
            const jobType = await db.jobType.findUnique({where: {id: parseInt(job_type_id, 10)}})
            const customer = await db.customer.findUnique({where: {id: parseInt(customer_id, 10)}})
            const vehicle = await db.vehicle.findUnique({where: {id: parseInt(vehicle_id, 10)}})

            if (!jobType) return res.status(404).json({ error_code: 404, msg: 'Job type not found.' });
            if (!customer) return res.status(404).json({ error_code: 404, msg: 'Customer not found.' });
            if (!vehicle) return res.status(404).json({ error_code: 404, msg: 'Vehicle not found.' });
            if (vehicle && vehicle.ownerID != customer.id) return res.status(400).json({ error_code: 400, msg: 'Vehicle does not belong to customer.' });

            // let data: {[key: string]: number | Date | string | null } = {
            const data: Prisma.JobUncheckedCreateInput = {
                jobTypeID: parseInt(job_type_id, 10),
                customerID: parseInt(customer_id, 10),
                vehicleID: parseInt(vehicle_id, 10),
            }

            if (delivery_date) data["deliveryDate"] = (new Date(delivery_date)).toISOString()


            // let data: Prisma.JobCreateInput = {}

            if (status) data["status"] = status

            const job = await db.job.create({
                data
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
                    status: true,
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
                    createdAt: true,
                    updatedAt: true
                },
                orderBy: {
                    id: 'asc'
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
                    status: true,
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
                    createdAt: true,
                    updatedAt: true
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
        const {delivery_date, status} = req.body;

        const job = await db.job.findUnique({where: {id: parseInt(id, 10)}})
        if (!job) {
            return res.status(404).json({ error_code: 404, msg: 'Job not found.' });
        }


        if (!isValidDate(delivery_date)) return res.status(400).json({ error_code: 400, msg: 'Invalid date. Please set date in the format YYYY-MM-DD' });
        if (status && !isValidJobStatus(status)) return res.status(400).json({ error_code: 400, msg: 'Invalid job status. Accepted values are: NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED' });

        try {
            const data: Prisma.JobUpdateInput = {} as Prisma.JobUpdateInput

            if (delivery_date) data["deliveryDate"] = (new Date(delivery_date)).toISOString()
            if (status) data["status"] = status
            const job = await db.job.update({
                where: {
                    id: parseInt(id, 10)
                },
                data
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
            })

            if (!job) return res.status(400).json({ error_code: 400, msg: "Job not found."})

            const deletedJob = await db.job.delete({ where : {id: parseInt(id, 10)}})
            
            res.status(200).json({data: deletedJob, msg: "Job deleted successfully."});

        } catch (error) {
            res.status(500).json({error_code: 500, msg: "Internal server error."})
        }
    }

}


class JobMaterial {
    async createMaterial (req: Request, res: Response) {
        const {name, cost} = req.body;
    
        if (!name || !cost) return res.status(400).json({ error_code: 400, msg: 'Missing information.' });
    
        try {
            const jobMaterial = await db.jobMaterial.create({
                data: {
                    productName: name,
                    productCost: parseFloat(cost)
                }
            })
            res.status(201).json({data: jobMaterial, msg: "Job material created successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not create job material.' });
        }
    }

    async getMaterials (req: Request, res: Response) {
        const name = req.query?.name?.toString() ?? ""
        try {
            const materials = await db.jobMaterial.findMany({
                where: {
                    productName: {
                        contains: name,
                        mode: "insensitive"
                    }
                },
                orderBy: {
                    id: 'asc'
                }
            });
            res.status(200).json({data: materials});
        } catch (error) {
            // console.log(error)
            res.status(400).json({ error_code: 400, msg: 'Could not get job materials.' });
        }
    }

    async getMaterial (req: Request, res: Response) {
        const { id } = req.params;
        try {
            const jobMaterial = await db.jobMaterial.findUnique({ where: { id: parseInt(id, 10) } });
            if (!jobMaterial) {
                return res.status(404).json({ error_code: 404, msg: 'Job material not found.' });
            }
            res.status(200).json({data: jobMaterial});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not get job material.' });
        }
    }

    async updateMaterial (req: Request, res: Response) {
        const { id } = req.params;
        const {name, cost} = req.body;

        const jobMaterial = await db.jobMaterial.findUnique({where: {id: parseInt(id, 10)}})
        if (!jobMaterial) return res.status(404).json({ error_code: 404, msg: 'Job material not found.' });
        
        try {
            if (!cost) return res.status(400).json({ error_code: 400, msg: 'Missing information.' });
            const jobMaterial = await db.jobMaterial.update({
                where: {
                    id: parseInt(id, 10)
                },
                data: {
                    productCost: parseFloat(cost)
                }
            })

            res.status(200).json({data: jobMaterial, msg: "Job material updated successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not update job material.' });
        }
    }

    async deleteMaterial (req: Request, res: Response) {
        const {id} = req.params

        const jobMaterial = await db.jobMaterial.findUnique({where: {id: parseInt(id, 10)}})
        if (!jobMaterial) return res.status(404).json({ error_code: 404, msg: 'Job material not found.' });

        try {
            const deletedJobMaterial = await db.jobMaterial.delete({ where : {id: parseInt(id, 10)}})
            
            res.status(200).json({data: deletedJobMaterial, msg: "Job material deleted successfully."});

        } catch (error) {
            res.status(500).json({error_code: 500, msg: "Internal server error."})
        }
    }

}

class JobController {
    job: Job
    jobMaterial: JobMaterial
    constructor() {
        this.job = new Job()
        this.jobMaterial = new JobMaterial()
    }
}


const jobController = new JobController();
export default jobController;
