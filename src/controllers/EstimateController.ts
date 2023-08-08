import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";
import { isValidDate } from "../utils/general";
import { compareArrays, convertStringToObjectArray, isValidDiscountType, isValidString } from "./InvoiceController";
import { EstimateJobMaterial, Prisma } from "@prisma/client";

class EstimateController {
    async createEstimate (req: Request, res: Response) {
        const {
            job_type_id,
            description,
            due_date,
            customer_id,
            vehicle_id,
            materials,
            service_charge,
            vat,
            discount,
            discount_type,
        } = req.body

        if (
            !job_type_id ||
            !vehicle_id ||
            !customer_id
        ) {
            return res.status(400).json({ error_code: 400, msg: 'Missing information.' });
        }

        if (due_date && !isValidDate(due_date)) return res.status(400).json({ error_code: 400, msg: 'Incorrect Date format for due_date. Please use the date format YYYY-MM-DD.' });

        try {
            const customer = await db.customer.findUnique({where: {id: parseInt(customer_id, 10)}})
            if (!customer) return res.status(404).json({ error_code: 404, msg: 'Customer not found.' });
            const vehicle = await db.vehicle.findFirst({where: {ownerID: customer.id}})
            if (!vehicle) return res.status(404).json({ error_code: 404, msg: "Vehicle not found or vehichle doesn't belong to customer."})
            if ((discount_type && !discount) || (discount && !discount_type)) return res.status(400).json({ error_code: 400, msg: 'Please provide both discount and discount_type.' });
            if (discount_type && !isValidDiscountType(discount_type)) return res.status(400).json({ error_code: 400, msg: 'Invalid discount_type.' });
            if (discount_type == "PERCENTAGE" && (parseFloat(discount) < 0 || parseFloat(discount) > 100)) return res.status(400).json({ error_code: 400, msg: 'Invalid discount value. Discount value must be between 0 and 100.' });

            const data: Prisma.EstimateUncheckedCreateInput = {
                customerID: parseInt(customer_id, 10),
                jobTypeID: parseInt(job_type_id, 10),
                vehicleID: parseInt(vehicle_id, 10),
                description,
                dueDate: due_date ? (new Date(due_date)).toISOString() : null
            }
            let total = 0;

            if (service_charge) {
                total += parseFloat(service_charge)
                data["serviceCharge"] = parseFloat(service_charge).toFixed(2)
            }

            let materialIDs, jobMaterials = [];
            if (materials) {
                if (!isValidString(materials)) return res.status(400).json({ error_code: 400, msg: 'Incorrect format for materials. Please use the format id:qty,id:qty.' });
                materialIDs = convertStringToObjectArray(materials)

                for (const item of materialIDs) {
                    const { id, qty } = item
                    const jobMaterial = await db.jobMaterial.findUnique({where: {id}})
                    if (!jobMaterial) return res.status(404).json({ error_code: 404, msg: 'Material not found.' });
                    jobMaterials.push(jobMaterial)
                    const productCostNumber = parseFloat(jobMaterial.productCost.toString());
                    total += productCostNumber * qty
                }
            }


            if (discount) {
                if (discount_type == "AMOUNT") total -= parseFloat(discount)
                if (discount_type == "PERCENTAGE") total -= total * (parseFloat(discount)/100)
                data["discount"] = parseFloat(discount)
                data["discountType"] = discount_type
            }

            if (vat) {
                data["vat"] = parseFloat(vat);
                total += total * (parseFloat(vat)/100)
            }

            data["amount"] = total
            // console.log(data)

            const estimate = await db.estimate.create({
                data
            })

            if (estimate && jobMaterials) {
                for (const mat of jobMaterials) {
                    await db.estimateJobMaterial.create({
                        data: {
                            estimateID: estimate.id,
                            jobMaterialID: mat.id,
                            quantity: materialIDs?.find((item) => item.id == mat.id)?.qty,
                            price: mat.productCost
                        }
                    })
                }
            }

            res.status(201).json({data: estimate, msg: "Estimate created successfully."});
        } catch (error) {
            console.error(error)
            res.status(400).json({ error_code: 400, msg: 'Could not create estimate.' });
        }
    }

    async getEstimates (req: Request, res: Response) {
        try {
            const estimates = await db.estimate.findMany({ select: {
                id: true,
                estimateNo: true,
                description: true,
                createdAt: true,
                dueDate: true,
                materials: true,
                vat: true,
                discount: true,
                amount: true,
                discountType: true,
                customerID: true,
                customer: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone:true,
                    }
                },
                vehicleID: true,
                vehicle: {
                    select: {
                        modelNo: true,
                        modelName: true,
                    }
                },
            },
            orderBy: {
                id: 'asc'
            }
        });
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
                    description: true,
                    createdAt: true,
                    dueDate: true,
                    serviceCharge: true,
                    vat: true,
                    discount: true,
                    amount: true,
                    discountType: true,
                    customer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            billingAddress: true,
                            companyContact: true,
                            companyName: true,
                            customerType: true
                        }
                    },
                    vehicle: {
                        select: {
                            modelNo: true,
                            modelName: true,
                            licensePlate: true
                        }
                    },
                    jobType: {
                        select: {
                            name: true
                        }
                    },
                    materials: {
                        select: {
                            id: true,
                            price: true,
                            quantity: true,
                            jobMaterial: {
                                select: {
                                    id: true,
                                    productName: true
                                }
                            }
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
            description,
            due_date,
            paid,
            job_type_id,
            service_charge,
            discount,
            discount_type,
            materials,
            vat
        } = req.body
        
        try {
            const estimate = await db.estimate.findUnique({where: {id: parseInt(id, 10)}})

            if (!estimate) return res.status(404).json({ error_code: 404, msg: 'Estimate not found.' });

            const data: Prisma.EstimateUncheckedCreateInput = {} as Prisma.EstimateUncheckedCreateInput
    
            if (due_date && !isValidDate(due_date)) return res.status(400).json({ error_code: 400, msg: 'Incorrect Date format for due_date. Please use the date format YYYY-MM-DD.' });
            if (due_date) data['dueDate'] = (new Date(due_date)).toISOString()
            if (description) data['description'] = description
            if (job_type_id) {
                const jobType = await db.jobType.findUnique({where: {id: parseInt(job_type_id, 10)}})
                if (!jobType) return res.status(404).json({ error_code: 404, msg: 'Job type not found.' });
                data['jobTypeID'] = parseInt(job_type_id, 10)
            }

            let total = 0;
    
            if (service_charge) {
                total += parseFloat(service_charge)
                data["serviceCharge"] = parseFloat(service_charge)
                // console.log(total, `adding service charge: ${service_charge}`)
            } else if(estimate.serviceCharge) {
                // console.log(total, `adding service charge: ${estimate.serviceCharge}`)
                total += parseFloat(estimate.serviceCharge.toString())
            }

            if ((discount_type && !discount) || (discount && !discount_type)) return res.status(400).json({ error_code: 400, msg: 'Please provide both discount and discount_type.' });
            if (discount_type && !isValidDiscountType(discount_type)) return res.status(400).json({ error_code: 400, msg: 'Invalid discount_type.' });
            if (discount_type == "PERCENTAGE" && (parseFloat(discount) < 0 || parseFloat(discount) > 100)) return res.status(400).json({ error_code: 400, msg: 'Invalid discount value. Discount value must be between 0 and 100.' });

            if (!isValidString(materials)) return res.status(400).json({ error_code: 400, msg: 'Incorrect format for materials. Please use the format id:qty,id:qty.' });

            
            const jobMaterials = await db.estimateJobMaterial.findMany({where: {estimateID: parseInt(id, 10)}});
            const updateJobMaterials = convertStringToObjectArray(materials);
            
            const {toBeAdded, toBeModified, toBeUnchanged, toBeRemoved} = compareArrays<EstimateJobMaterial>(updateJobMaterials, jobMaterials);

            // console.log("add", toBeAdded, "mod", toBeModified, "remove", toBeRemoved, "unchanged", toBeUnchanged)

            for (const jobMaterial of toBeAdded) {
                const jobMaterialFind = await db.jobMaterial.findUnique({where: {id: jobMaterial.id}})
                if (!jobMaterialFind) return res.status(404).json({ error_code: 404, msg: 'Material not found.' });
                await db.estimateJobMaterial.create({
                    data: {
                        estimateID: parseInt(id, 10),
                        jobMaterialID: jobMaterial.id,
                        quantity: jobMaterial.qty,
                        price: jobMaterialFind.productCost
                    }
                })      
                const productCostNumber = parseFloat(jobMaterialFind.productCost.toString());
                total += productCostNumber * jobMaterial.qty
                // console.log(total, `adding new material: ${jobMaterialFind.productName} ${jobMaterialFind.productCost}`)
            }

            for (const jobMaterial of toBeModified) {
                const jobMaterialGet = await db.estimateJobMaterial.findFirst({where: {AND: {jobMaterialID: jobMaterial.id, estimateID: parseInt(id, 10)}}})
                if (jobMaterialGet) {
                    await db.estimateJobMaterial.update({
                        where: {id: jobMaterialGet.id},
                        data: {quantity: jobMaterial.qty}
                    })
                    total += parseFloat(jobMaterialGet.price.toString()) * jobMaterial.qty
                    // console.log(total, `modifying material: ${parseFloat(jobMaterialGet.price.toString()) * jobMaterial.qty}`)
                }
            }

            for (const jobMaterial of toBeUnchanged) {
                total += parseFloat(jobMaterial.price.toString()) * jobMaterial.quantity
                // console.log(total, `unchanged material: ${parseFloat(jobMaterial.price.toString()) * jobMaterial.quantity}`)
            }

            for (const jobMaterial of toBeRemoved) {
                await db.estimateJobMaterial.delete({where: {id: jobMaterial.id}})
            }

            if (discount) {
                if (discount_type == "AMOUNT") total -= parseFloat(discount)
                if (discount_type == "PERCENTAGE") total -= total * (parseFloat(discount)/100)
                data["discount"] = parseFloat(discount)
                data["discountType"] = discount_type
                // console.log(total, `discount new ${discount}`)
            } else {
                if (estimate.discount) {
                    if (estimate.discountType == "AMOUNT") total -= parseFloat(estimate.discount.toString())
                    if (estimate.discountType == "PERCENTAGE") total -= total * (parseFloat(estimate.discount.toString())/100)
                // console.log(total, `discount old ${estimate.discount}`)
            }
            }

            if (vat) {
                data["vat"] = parseFloat(vat);
                // console.log(total, `vat new ${total * (parseFloat(vat)/100)}`)
                total += total * (parseFloat(vat)/100)
            } else if (estimate.vat) {
                // console.log(total, `vat old ${total * (parseFloat(estimate.vat.toString())/100)}`)
                total += total * (parseFloat(estimate.vat.toString())/100)
            }

            data["amount"] = total
            // console.log(total,"total")
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
