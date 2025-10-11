import { JobStatus, Prisma } from "@prisma/client";
import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";
import { isValidDate } from "../utils/general";


function isValidJobStatus(status: string) {
    return Object.values(JobStatus).includes(status as JobStatus);
}


class Job  {

    async createJobType (req: Request, res: Response) {
        // detokenizedRole is expected from an authentication middleware
        const { name, detokenizedRole } = req.body;

        try {
            // Authorization check: Ensure the user is an admin
            const role = await db.role.findUnique({ where: { id: detokenizedRole } });

            if (role && role.name === "admin") {
                if (!name) {
                    return res.status(400).json({ error_code: 400, msg: 'Missing information: Job type name is required.' });
                }

                // Check if a job type with the same name already exists using findFirst
                // This does not require 'name' to be @unique in your Prisma schema.
                const existingJobType = await db.jobType.findFirst({
                    where: { name: name as string }
                });

                if (existingJobType) {
                    return res.status(409).json({ error_code: 409, msg: 'Job type with this name already exists.' });
                }

                // Create the new job type
                const newJobType = await db.jobType.create({
                    data: {
                        name: name as string,
                    }
                });

                res.status(201).json({ data: newJobType, msg: "Job type created successfully." });

            } else {
                // Not authorized: User is not an admin
                res.status(401).json({ error_code: 401, msg: 'You are not authorized to create a job type.' });
            }
        } catch (error) {
            console.error("Error creating job type:", error);
            res.status(500).json({ error_code: 500, msg: 'Internal server error.' });
        }
    }

    async getJobTypes(req: Request, res: Response) {
        const name = req.query?.name?.toString() ?? "";
        const page = parseInt(req.query?.page?.toString() ?? "1");
        const limit = parseInt(req.query?.limit?.toString() ?? "10");

        try {
            let jobTypes;
            let totalCount = 0;

            const whereClause = {
                name: {
                    contains: name,
                    // mode: "insensitive", // Note: Use for case-insensitive search on PostgreSQL
                },
            };

            // Check if pagination parameters are provided
            if (!req.query.page && !req.query.limit) {
                // If not, fetch all matching job types
                jobTypes = await db.jobType.findMany({
                    where: whereClause,
                    orderBy: {
                        createdAt: 'desc',
                    },
                });
                totalCount = jobTypes.length;
            } else {
                // If yes, retrieve job types with pagination
                jobTypes = await db.jobType.findMany({
                    where: whereClause,
                    orderBy: {
                        createdAt: 'desc',
                    },
                    skip: (page - 1) * limit, // Calculate the offset
                    take: limit, // Limit the number of items
                });

                // Get the total count for pagination UI
                totalCount = await db.jobType.count({
                    where: whereClause,
                });
            }

            const isLastPage = (page * limit) >= totalCount;

            res.status(200).json({ data: jobTypes, totalCount, isLastPage });
        } catch (error) {
            console.error("Error getting job types:", error);
            res.status(400).json({ error_code: 400, msg: 'Could not get job types.' });
        }
    }
    
    async getJobTypeById(req: Request, res: Response) {
        const idParam = req.params.id; // Retrieves ID from the URL path (e.g., /job-types/123)

        // 2. CONVERT THE STRING ID TO A NUMBER
        const id = parseInt(idParam); 
        
        // Optional: Add validation to ensure the conversion was successful
        if (isNaN(id)) {
            return res.status(400).json({ msg: 'Invalid Job Type ID provided.' });
        }
        try {
            const jobType = await db.jobType.findUnique({
                where: {
                    id: id,
                },
            });

            if (!jobType) {
                return res.status(404).json({ msg: "Job type not found." });
            }

            res.status(200).json({ data: jobType });

        } catch (error) {
            console.error("Error getting job type by id:", error);
            res.status(400).json({ error_code: 400, msg: 'Could not get job type by id.' });
        }
    }

    async updateJobType (req: Request, res: Response) {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) return res.status(400).json({ error_code: 400, msg: 'Job type name is required.' });

        try {
            const jobType = await db.jobType.findUnique({where: {id: parseInt(id, 10)}})
            if (!jobType) return res.status(404).json({ error_code: 404, msg: 'Job type not found.' });
            
            // Check if another job type with the new name already exists
            const existingJobType = await db.jobType.findFirst({
                where: { 
                    name: name as string,
                    NOT: { id: parseInt(id, 10) } // Exclude the current job type
                }
            });

            if (existingJobType) {
                return res.status(409).json({ error_code: 409, msg: 'Job type with this name already exists.' });
            }


            const updatedJobType = await db.jobType.update({
                where: {
                    id: parseInt(id, 10)
                },
                data: {
                    name: name as string
                }
            })

            res.status(200).json({data: updatedJobType, msg: "Job type updated successfully."});
        } catch (error) {
            console.error("Error updating job type:", error);
            res.status(500).json({ error_code: 500, msg: 'Internal server error.' });
        }
    }

    async deleteJobType (req: Request, res: Response) {
        const {id} = req.params
        
        try {
            const jobType = await db.jobType.findUnique({where: {id: parseInt(id, 10)}})
            if (!jobType) return res.status(404).json({ error_code: 404, msg: 'Job type not found.' });
            
            // Check for dependent records (jobs, invoices, estimates)
            // You may need to adjust this based on your Prisma 'onDelete' setting
            // For a soft delete or a check for dependents:
            const dependents = await db.job.count({ where: { jobTypeID: parseInt(id, 10) } });

            if (dependents > 0) {
                return res.status(409).json({ error_code: 409, msg: 'Cannot delete job type as it is linked to one or more jobs.' });
            }

            const deletedJobType = await db.jobType.delete({ where : {id: parseInt(id, 10)}})
            
            res.status(200).json({data: deletedJobType, msg: "Job type deleted successfully."});

        } catch (error) {
            console.error("Error deleting job type:", error);
            res.status(500).json({error_code: 500, msg: "Internal server error."})
        }
    }

    async createJob (req: Request, res: Response) {
        const {
            job_type_id,
            customer_id,
            vehicle_id,
            delivery_date,
            status,
            mileage,
            customerIssue, // New field
            technician,    // New field
            supervisor,    // New field
            receptionDate  // New field
        } = req.body

        if (
            !job_type_id ||
            !customer_id ||
            !vehicle_id
        ) {
            return res.status(400).json({ error_code: 400, msg: 'Missing information.' });
        }

        if (delivery_date && !isValidDate(delivery_date)) {
            return res.status(400).json({ error_code: 400, msg: 'Incorrect Date format for delivery_date. Please use the date format YYYY-MM-DD.' });
        }

        // Validate receptionDate if provided
        if (receptionDate && !isValidDate(receptionDate)) {
            return res.status(400).json({ error_code: 400, msg: 'Incorrect Date format for receptionDate. Please use the date format YYYY-MM-DD.' });
        }

        if (status && !isValidJobStatus(status)) {
            return res.status(400).json({ error_code: 400, msg: 'Invalid job status. Accepted values are: NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED' });
        }

        try {
            const jobType = await db.jobType.findUnique({where: {id: parseInt(job_type_id, 10)}})
            const customer = await db.customer.findUnique({where: {id: parseInt(customer_id, 10)}})
            const vehicle = await db.vehicle.findUnique({where: {id: parseInt(vehicle_id, 10)}})

            if (!jobType) return res.status(404).json({ error_code: 404, msg: 'Job type not found.' });
            if (!customer) return res.status(404).json({ error_code: 404, msg: 'Customer not found.' });
            if (!vehicle) return res.status(404).json({ error_code: 404, msg: 'Vehicle not found.' });
            if (vehicle && vehicle.ownerID != customer.id) return res.status(400).json({ error_code: 400, msg: 'Vehicle does not belong to customer.' });

            const data: Prisma.JobUncheckedCreateInput = {
                jobTypeID: parseInt(job_type_id, 10),
                customerID: parseInt(customer_id, 10),
                vehicleID: parseInt(vehicle_id, 10),
            }

            if (delivery_date) data["deliveryDate"] = (new Date(delivery_date)).toISOString();
            if (status) data["status"] = status;

            // Assign new fields to the data object
            if (customerIssue) data["customerIssue"] = customerIssue;
            if (technician) data["technician"] = technician;
            if (supervisor) data["supervisor"] = supervisor;
            if (receptionDate) data["receptionDate"] = (new Date(receptionDate)).toISOString();


            if (mileage) {
                const latestMilage = await db.mileage.findFirst({
                    where: {
                        vehicleID: parseInt(vehicle_id, 10)
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                })

                if (latestMilage && latestMilage.mileage > parseInt(mileage, 10)) {
                    return res.status(400).json({ error_code: 400, msg: 'Cannot decrease mileage.' });
                }

                await db.mileage.create({
                    data: {
                        mileage: parseInt(mileage, 10),
                        vehicleID: vehicle.id
                    }
                })
            }

            const job = await db.job.create({
                data
            })

            res.status(201).json({data: job, msg: "Job created successfully."});
        } catch (error) {
            console.error("Error creating job:", error); // Added more specific error logging
            res.status(500).json({ error_code: 500, msg: 'Could not create job.' }); // Changed to 500 for internal server error
        }
    }
    
    async getJobs (req: Request, res: Response) {
        const customerID = req.query.customerID ? req.query.customerID as string : (req.params.customerID ? req.params.customerID as string : null);
        const page = Number(req.query.page) || undefined;
        const limit = Number(req.query.limit) || undefined;
        const filterValue = req.query?.filter as string || null;
        const status = req.query?.status as string || null;
        const jobTypeID = req.query.job_type_id ? req.query.job_type_id as string : null; // New filter parameter
        const startDatetime = req.body?.start;
        const endDatetime = req.body?.end;

        const whereFilter: Prisma.JobWhereInput = {};
    
        if (customerID && isNaN(parseInt(customerID, 10))) {
            return res.status(400).json({ error_code: 400, msg: 'Invalid customer ID.' });
        }

        if ((startDatetime && !endDatetime) || (!startDatetime && endDatetime)) {
            return res.status(400).json({ error_code: 400, msg: 'start and end datetime must be provided' });
        }


        if ((startDatetime && !isValidDate(startDatetime)) || (endDatetime && !isValidDate(endDatetime))) {
            return res.status(400).json({ error_code: 400, msg: 'Invalid start or end datetime format.' });
        }

        // Add job type filter to the where clause
        if (jobTypeID && !isNaN(parseInt(jobTypeID, 10))) {
            whereFilter.jobTypeID = parseInt(jobTypeID, 10);
        }

        if (filterValue) {
            const jobTypeID = await db.jobType.findFirst({
                where: {
                    name: { contains: filterValue }
                },
                select: {
                    id: true
                }
            })

            const customerIDs = await db.customer.findMany({
                where: {
                    OR: [
                        { firstName: { contains: filterValue } },
                        { lastName: { contains: filterValue } }, 
                    ]
                },
            })

            if (customerID) {
                whereFilter.AND = [
                    {
                        OR: [
                           {
                                vehicleID: {
                                    in: await db.vehicle.findMany({
                                        where: {
                                            licensePlate: { contains: filterValue }
                                        },
                                        select: {
                                            id: true
                                        },
                                    }).then((vehicleIds) => vehicleIds.map((vehicle) => vehicle.id)),
                                },
                            },
                            {
                                customerID: {
                                    in: customerIDs.map((customer) => customer.id)
                                }
                            },
                            {
                                id: {
                                    equals: parseInt(filterValue, 10) || 0
                                }
                            }
                        ]
                    },
                    {customerID: {equals: parseInt(customerID, 10)}},
                ];
                if (jobTypeID && whereFilter.AND[0].OR) {
                    whereFilter.AND[0].OR.push({jobTypeID: {equals: jobTypeID.id}});
                }
            } else {
                whereFilter.OR = [
                    {
                        vehicleID: {
                            in: await db.vehicle.findMany({
                                where: {
                                    licensePlate: { contains: filterValue }
                                },
                                select: {
                                    id: true
                                },
                            }).then((vehicleIds) => vehicleIds.map((vehicle) => vehicle.id)),
                        },
                    },
                    {
                        customerID: {
                            in: customerIDs.map((customer) => customer.id)
                        }
                    },
                    {
                        id: {
                            equals: parseInt(filterValue, 10) || 0
                        }
                    }
                ]
                if (jobTypeID) {
                    whereFilter.OR.push({jobTypeID: {equals: jobTypeID.id}})
                }
            }
        }

        const countFilter = JSON.parse(JSON.stringify(whereFilter));

        if (status && Object.values(JobStatus).some(statusE => status?.toLowerCase().includes(statusE.toLowerCase()))) {
            whereFilter.status = { in: Object.values(JobStatus).filter(statusE => status?.toLowerCase().includes(statusE.toLowerCase())).map(status => status as JobStatus) }
        }

        
        let filterOptions: Prisma.JobWhereInput = customerID ? { AND: [{ customerID: parseInt(customerID, 10) }, whereFilter] } : whereFilter;
        let countFilterOptions: Prisma.JobWhereInput = customerID ? { AND: [{ customerID: parseInt(customerID, 10) }, countFilter] } : countFilter;

        try {
            let jobs;
            let counts = {};
        
            if (page !== undefined && limit !== undefined) {
            // Pagination is requested

            if (
                true
                // !filterOptions.OR?.some(option => 'status' in option) ||
                // (Array.isArray(filterOptions.AND) && filterOptions.AND.length > 0 && !filterOptions.AND[0].OR?.some(option => 'status' in option))
            ) {
                const statusCounts = await db.job.groupBy({
                    by: ['status'],
                    where: countFilterOptions,
                    _count: true,
                });

                const statusCountsMap = Object.values(JobStatus).reduce((acc, status) => {
                    acc[status] = statusCounts.find(statusCount => statusCount.status === status)?._count ?? 0;
                    return acc;
                }, {} as { [status in JobStatus]: number });

                const totalStatusCounts = Object.values(JobStatus).reduce((acc, status) => acc + (statusCountsMap[status] ?? 0), 0);
                counts = {...statusCountsMap, TOTAL: totalStatusCounts}
            }
        
            // Retrieve jobs with pagination
            jobs = await db.job.findMany({
                where: whereFilter,
                select: {
                id: true,
                jobTypeID: true,
                status: true,
                jobType: {
                    select: {
                    name: true,
                    },
                },
                customerID: true,
                customer: {
                    select: {
                    firstName: true,
                    lastName: true,
                    },
                },
                vehicleID: true,
                vehicle: {
                    select: {
                    id: true,
                    modelNo: true,
                    modelName: true,
                    licensePlate: true,
                    chasisNo: true,
                    },
                },
                deliveryDate: true,
                createdAt: true,
                updatedAt: true,
                },
                orderBy: {
                id: 'desc',
                },
                skip: (page - 1) * limit, // Calculate the offset
                take: limit, // Limit the number of items per page
            });
        
            // Check if the number of items returned is less than the specified limit
            const isLastPage = jobs.length < limit;
        
            res.status(200).json({ data: jobs, counts, isLastPage });
            } else {
            // No pagination
            let counts = {};
            if (startDatetime && endDatetime) {
                filterOptions = {
                    ...filterOptions,
                  createdAt: {
                    gte: new Date(startDatetime),
                    lte: new Date(endDatetime),
                  },
                };
            }

            if (
                true
                // !filterOptions.OR?.some(option => 'status' in option) ||
                // (Array.isArray(filterOptions.AND) && filterOptions.AND.length > 0 && !filterOptions.AND[0].OR?.some(option => 'status' in option))
            ) {
                const statusCounts = await db.job.groupBy({
                    by: ['status'],
                    where: countFilterOptions,
                    _count: true,
                });

                const statusCountsMap = Object.values(JobStatus).reduce((acc, status) => {
                    acc[status] = statusCounts.find(statusCount => statusCount.status === status)?._count ?? 0;
                    return acc;
                }, {} as { [status in JobStatus]: number });

                const totalStatusCounts = Object.values(JobStatus).reduce((acc, status) => acc + (statusCountsMap[status] ?? 0), 0);

                counts = {...statusCountsMap, TOTAL: totalStatusCounts}
            }

            jobs = await db.job.findMany({
                where: filterOptions,
                select: {
                id: true,
                jobTypeID: true,
                status: true,
                jobType: {
                    select: {
                    name: true,
                    },
                },
                customerID: true,
                customer: {
                    select: {
                    firstName: true,
                    lastName: true,
                    },
                },
                vehicleID: true,
                vehicle: {
                    select: {
                    id: true,
                    modelNo: true,
                    modelName: true,
                    licensePlate: true,
                    chasisNo: true,
                    },
                },
                deliveryDate: true,
                createdAt: true,
                updatedAt: true,
                },
                orderBy: {
                id: 'asc',
                },
            });
            res.status(200).json({ data: jobs, counts, msg: "Jobs Fetched Successfully!" });
            }
        } catch (error) {
            console.log(error)
            res.status(400).json({ error_code: 400, msg: 'Could not get jobs.' });
        }
    }
    

    async getJob(req: Request, res: Response) {
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
                            name: true,
                        },
                    },
                    customerID: true,
                    customer: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                    vehicleID: true,
                    vehicle: {
                        select: {
                            modelNo: true,
                            modelName: true,
                            licensePlate: true,
                            chasisNo: true,
                        },
                    },
                    deliveryDate: true,
                    createdAt: true,
                    updatedAt: true,
                    // Add the new fields here
                    customerIssue: true,
                    technician: true,
                    supervisor: true,
                    receptionDate: true,
                },
            });
            if (!job) {
                return res.status(404).json({ error_code: 404, msg: 'Job not found.' });
            }
            res.status(200).json({ data: job });
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not get job.' });
        }
    }

    async updateJob (req: Request, res: Response) {
        // async updateJob (req: Request, res: Response) {
        const { id } = req.params;
        const {delivery_date, status, mileage} = req.body;

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

            if (mileage) {
                await db.mileage.create({
                    data: {
                        mileage: parseInt(mileage, 10),
                        vehicleID: job.vehicleID
                    }
                })
            }

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

    async batchUpdateJobStatus(req: Request, res: Response) {
        const { jobIds, status } = req.body;

        // 1. Validate input
        if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
            return res.status(400).json({ error_code: 400, msg: 'Missing or invalid jobIds array.' });
        }
        if (!status || !isValidJobStatus(status)) {
            return res.status(400).json({ error_code: 400, msg: `Invalid status provided. Accepted values are: ${Object.values(JobStatus).join(', ')}` });
        }

        // Ensure all IDs are valid integers
        const validJobIds = jobIds.map((id: any) => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);

        if (validJobIds.length !== jobIds.length) {
            return res.status(400).json({ error_code: 400, msg: 'One or more job IDs are invalid.' });
        }

        try {
            // 2. Perform the batch update using Prisma's updateMany
            const updateResult = await db.job.updateMany({
                where: {
                    id: {
                        in: validJobIds,
                    },
                },
                data: {
                    status: status as JobStatus,
                },
            });

            // 3. Respond with success
            res.status(200).json({
                data: {
                    count: updateResult.count,
                    jobIds: validJobIds,
                    newStatus: status
                },
                msg: `${updateResult.count} job(s) updated successfully.`
            });

        } catch (error) {
            console.error("Error during batch job status update:", error);
            res.status(500).json({ error_code: 500, msg: 'Internal server error during batch update.' });
        }
    }

    /*
    async getJobsWithMaterials(req: Request, res: Response) {
        const customerID = req.query.customerID ? req.query.customerID as string : (req.params.customerID ? req.params.customerID as string : null);
        const page = Number(req.query.page) || undefined;
        const limit = Number(req.query.limit) || undefined;
        const filterValue = req.query?.filter as string || null;
        const status = req.query?.status as string || null;
        const jobTypeID = req.query.job_type_id ? req.query.job_type_id as string : null;

        const whereFilter: Prisma.JobWhereInput = {};

        try {
            // Validate customerID
            if (customerID && isNaN(parseInt(customerID, 10))) {
                return res.status(400).json({ error_code: 400, msg: 'Invalid customer ID.' });
            }

            // Add job type filter
            if (jobTypeID && !isNaN(parseInt(jobTypeID, 10))) {
                whereFilter.jobTypeID = parseInt(jobTypeID, 10);
            }

            // Add status filter
            if (status && Object.values(JobStatus).some(s => status.toLowerCase().includes(s.toLowerCase()))) {
                whereFilter.status = {
                    in: Object.values(JobStatus).filter(s => status.toLowerCase().includes(s.toLowerCase())) as JobStatus[]
                };
            }

            // Add filterValue conditions
            if (filterValue) {
                const orConditions: Prisma.JobWhereInput[] = [];

                // Search for job type
                const jobType = await db.jobType.findFirst({
                    where: { name: { contains: filterValue } }, // MySQL is case-sensitive by default
                    select: { id: true }
                });

                // Search for customers
                const customers = await db.customer.findMany({
                    where: {
                        OR: [
                            { firstName: { contains: filterValue } },
                            { lastName: { contains: filterValue } },
                        ]
                    },
                    select: { id: true }
                });

                // Search for vehicles
                const vehicles = await db.vehicle.findMany({
                    where: { licensePlate: { contains: filterValue } },
                    select: { id: true }
                });

                // Build OR conditions
                if (vehicles.length > 0) {
                    orConditions.push({ vehicleID: { in: vehicles.map(v => v.id) } });
                }
                if (customers.length > 0) {
                    orConditions.push({ customerID: { in: customers.map(c => c.id) } });
                }
                if (!isNaN(parseInt(filterValue, 10))) {
                    orConditions.push({ id: { equals: parseInt(filterValue, 10) } });
                }
                if (jobType) {
                    orConditions.push({ jobTypeID: { equals: jobType.id } });
                }

                // Apply OR conditions only if there are any
                if (orConditions.length > 0) {
                    if (customerID) {
                        whereFilter.AND = [
                            { OR: orConditions },
                            { customerID: { equals: parseInt(customerID, 10) } },
                        ];
                    } else {
                        whereFilter.OR = orConditions;
                    }
                }
            }

            const finalFilter: Prisma.JobWhereInput = customerID ? { AND: [{ customerID: parseInt(customerID, 10) }, whereFilter] } : whereFilter;

            // Define the query structure
            const queryArgs: Prisma.JobFindManyArgs = {
                where: finalFilter,
                include: {
                    customer: { select: { firstName: true, lastName: true } },
                    vehicle: { select: { modelName: true, modelNo: true, licensePlate: true } },
                    jobType: { select: { name: true } },
                    invoice: {
                        select: {
                            id: true,
                            materials: {
                                select: {
                                    id: true,
                                    quantity: true,
                                    price: true,
                                    jobMaterial: {
                                        select: {
                                            id: true,
                                            productName: true
                                        }
                                    }
                                },
                                where: {
                                    jobMaterialID: { not: undefined }, // Filter out null jobMaterialID
                                    jobMaterial: { is: { id: { not: undefined } } } // Ensure jobMaterial exists
                                }
                            }
                        }
                    }
                },
                orderBy: { id: 'asc' }
            };

            // Execute query with or without pagination
            let jobs;
            const totalCount = await db.job.count({ where: finalFilter });

            if (page !== undefined && limit !== undefined) {
                jobs = await db.job.findMany({
                    ...queryArgs,
                    skip: (page - 1) * limit,
                    take: limit,
                });

                const isLastPage = (page * limit) >= totalCount || jobs.length < limit;
                res.status(200).json({ data: jobs, totalCount, isLastPage });
            } else {
                jobs = await db.job.findMany(queryArgs);
                res.status(200).json({ data: jobs, totalCount, msg: "Jobs with materials fetched successfully!" });
            }
        } catch (error) {
            console.error("Error in getJobsWithMaterials:", {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                queryParams: { customerID, page, limit, filterValue, status, jobTypeID }
            });
            res.status(500).json({ error_code: 500, msg: 'Could not get jobs with materials.' });
        }
    }
    */
    
    async getJobsWithMaterials(req: Request, res: Response) {
        const customerID = req.query.customerID ? req.query.customerID as string : (req.params.customerID ? req.params.customerID as string : null);
        const page = Number(req.query.page) || undefined;
        const limit = Number(req.query.limit) || undefined;
        const filterValue = req.query?.filter as string || null;
        const status = req.query?.status as string || null;
        const jobTypeID = req.query.job_type_id ? req.query.job_type_id as string : null;

        const whereFilter: Prisma.JobWhereInput = {};

        try {
            // Validate customerID
            if (customerID && isNaN(parseInt(customerID, 10))) {
                return res.status(400).json({ error_code: 400, msg: 'Invalid customer ID.' });
            }

            // Add job type filter
            if (jobTypeID && !isNaN(parseInt(jobTypeID, 10))) {
                whereFilter.jobTypeID = parseInt(jobTypeID, 10);
            }

            // Add status filter
            if (status && Object.values(JobStatus).some(s => status.toLowerCase().includes(s.toLowerCase()))) {
                whereFilter.status = {
                    in: Object.values(JobStatus).filter(s => status.toLowerCase().includes(s.toLowerCase())) as JobStatus[]
                };
            }

            // Add filterValue conditions
            if (filterValue) {
                const orConditions: Prisma.JobWhereInput[] = [];

                // Search for job type
                const jobType = await db.jobType.findFirst({
                    where: { name: { contains: filterValue } }, // MySQL is case-sensitive by default
                    select: { id: true }
                });

                // Search for customers
                const customers = await db.customer.findMany({
                    where: {
                        OR: [
                            { firstName: { contains: filterValue } },
                            { lastName: { contains: filterValue } },
                        ]
                    },
                    select: { id: true }
                });

                // Search for vehicles
                const vehicles = await db.vehicle.findMany({
                    where: { licensePlate: { contains: filterValue } },
                    select: { id: true }
                });

                // Build OR conditions
                if (vehicles.length > 0) {
                    orConditions.push({ vehicleID: { in: vehicles.map(v => v.id) } });
                }
                if (customers.length > 0) {
                    orConditions.push({ customerID: { in: customers.map(c => c.id) } });
                }
                if (!isNaN(parseInt(filterValue, 10))) {
                    orConditions.push({ id: { equals: parseInt(filterValue, 10) } });
                }
                if (jobType) {
                    orConditions.push({ jobTypeID: { equals: jobType.id } });
                }

                // Apply OR conditions only if there are any
                if (orConditions.length > 0) {
                    if (customerID) {
                        whereFilter.AND = [
                            { OR: orConditions },
                            { customerID: { equals: parseInt(customerID, 10) } },
                        ];
                    } else {
                        whereFilter.OR = orConditions;
                    }
                }
            }

            const finalFilter: Prisma.JobWhereInput = customerID ? { AND: [{ customerID: parseInt(customerID, 10) }, whereFilter] } : whereFilter;

            // Define the query structure
            const queryArgs: Prisma.JobFindManyArgs = {
                where: finalFilter,
                select: {
                    id: true,
                    customerID: true,
                    vehicleID: true,
                    jobTypeID: true,
                    deliveryDate: true,
                    customerIssue: true, // Include customerIssue field
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    customer: { select: { firstName: true, lastName: true } },
                    vehicle: { select: { modelName: true, modelNo: true, licensePlate: true } },
                    jobType: { select: { name: true } },
                    invoice: {
                        select: {
                            id: true,
                            materials: {
                                select: {
                                    id: true,
                                    quantity: true,
                                    price: true,
                                    jobMaterial: {
                                        select: {
                                            id: true,
                                            productName: true
                                        }
                                    }
                                },
                                where: {
                                    AND: [
                                        { jobMaterialID: { not: undefined } }, // Filter out null jobMaterialID
                                        { jobMaterial: { is: { id: { not: undefined } } } } // Ensure jobMaterial exists
                                    ]
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            };

            // Execute query with or without pagination
            let jobs;
            const totalCount = await db.job.count({ where: finalFilter });

            if (page !== undefined && limit !== undefined) {
                jobs = await db.job.findMany({
                    ...queryArgs,
                    skip: (page - 1) * limit,
                    take: limit,
                });

                const isLastPage = (page * limit) >= totalCount || jobs.length < limit;
                res.status(200).json({ data: jobs, totalCount, isLastPage });
            } else {
                jobs = await db.job.findMany(queryArgs);
                res.status(200).json({ data: jobs, totalCount, msg: "Jobs with materials fetched successfully!" });
            }
        } catch (error) {
            console.error("Error in getJobsWithMaterials:", {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                queryParams: { customerID, page, limit, filterValue, status, jobTypeID }
            });
            res.status(500).json({ error_code: 500, msg: 'Could not get jobs with materials.' });
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

    async getMaterials(req: Request, res: Response) {
        const name = req.query?.name?.toString() ?? "";
        const page = parseInt(req.query?.page?.toString() ?? "1");
        const limit = parseInt(req.query?.limit?.toString() ?? "100");
    
        try {
            let materials;
            let totalCount = 0;
    
            if (!req.query.page && !req.query.limit) {
                // Fetch all materials without pagination
                materials = await db.jobMaterial.findMany({
                    where: {
                        productName: {
                            contains: name,
                            // mode: "insensitive", // only use in psql
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });
    
                totalCount = materials.length;
            } else {
                // Retrieve materials matching the query with pagination
                materials = await db.jobMaterial.findMany({
                    where: {
                        productName: {
                            contains: name,
                            // mode: "insensitive",
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    skip: (page - 1) * limit, // Calculate the offset
                    take: limit, // Limit the number of items per page
                });
    
                totalCount = await db.jobMaterial.count({
                    where: {
                        productName: {
                            contains: name,
                            // mode: "insensitive",
                        },
                    },
                });
            }
    
            const isLastPage = materials.length < limit;
    
            res.status(200).json({ data: materials, totalCount, isLastPage });
        } catch (error) {
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

        const data: Prisma.JobMaterialUncheckedUpdateInput = {} as Prisma.JobMaterialUncheckedUpdateInput;
        if (name) data.productName = name;
        if (cost) data.productCost = parseFloat(cost);
        
        try {
            const jobMaterial = await db.jobMaterial.update({
                where: {
                    id: parseInt(id, 10)
                },
                data
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
