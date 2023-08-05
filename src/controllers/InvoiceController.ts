import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";
import { isValidDate } from "../utils/general";
import { DiscountType, Prisma } from "@prisma/client";

function isValidDiscountType(type: string) {
    return Object.values(DiscountType).includes(type as DiscountType);
}

function isValidString(inputString: string) {
    const pattern = /^(\d+:\d+(?:,|$))+$/;
    return pattern.test(inputString);
  }
  
function convertStringToObjectArray(inputString: string) {
    if (!isValidString(inputString)) {
        throw new Error('Invalid input string format');
    }

    const objArray = inputString.split(',').map((item: string) => {
        const [id, qty] = item.split(':');
        return { id: parseInt(id), qty: parseInt(qty) };
    });

    return objArray;
}

class InvoiceController {
    async createInvoice (req: Request, res: Response) {
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

            const data: Prisma.InvoiceUncheckedCreateInput = {
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
            } else {
                total += total * (7.5/100)
            }

            data["amount"] = total
            // console.log(data)

            const invoice = await db.invoice.create({
                data
            })

            if (invoice && jobMaterials) {
                for (const mat of jobMaterials) {
                    await db.invoiceJobMaterial.create({
                        data: {
                            invoiceID: invoice.id,
                            jobMaterialID: mat.id,
                            quantity: materialIDs?.find((item) => item.id == mat.id)?.qty,
                            price: mat.productCost
                        }
                    })
                }
            }

            res.status(201).json({data: invoice, msg: "Invoice created successfully."});
        } catch (error) {
            console.error(error)
            res.status(400).json({ error_code: 400, msg: 'Could not create invoice.' });
        }
    }

    async getInvoices (req: Request, res: Response) {
        try {
            const invoices = await db.invoice.findMany({ select: {
                id: true,
                invoiceNo: true,
                paid: true,
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
            res.status(200).json({data: invoices, msg: "Invoices retrieved successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not retrieve invoices.' });
        }
    }

    async getInvoice (req: Request, res: Response) {
        const { id } = req.params;
        try {
            const invoice = await db.invoice.findUnique({ 
                where: { id: parseInt(id, 10) },
                select: {
                    id: true,
                    invoiceNo: true,
                    paid: true,
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
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            billingAddress: true,
                            companyContact: true,
                            companyName: true
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
                            price: true,
                            quantity: true,
                            jobMaterial: {
                                select: {
                                    productName: true
                                }
                            }
                        }
                    }            
                }
             });
            if (!invoice) {
                return res.status(404).json({ error_code: 404, msg: 'Invoice not found.' });
            }
            res.status(200).json({data: invoice, msg: "Invoice retrieved successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not retrieve invoice.' });
        }
    }

    async updateInvoice (req: Request, res: Response) {
        const { id } = req.params;
        const {
            description,
            due_date,
            paid
        } = req.body
        
        try {
            const invoice = await db.invoice.findUnique({where: {id: parseInt(id, 10)}})

            if (!invoice) return res.status(404).json({ error_code: 404, msg: 'Invoice not found.' });
            const data: Prisma.InvoiceUncheckedCreateInput = {} as Prisma.InvoiceUncheckedCreateInput
    
            if (due_date && !isValidDate(due_date)) return res.status(400).json({ error_code: 400, msg: 'Incorrect Date format for due_date. Please use the date format YYYY-MM-DD.' });
            if (due_date) data['dueDate'] = (new Date(due_date)).toISOString()
            if (description) data['description'] = description
            if (paid) data['paid'] = paid

            const updatedInvoice = await db.invoice.update({
                where: {id: parseInt(id, 10)},
                data
            })
            res.status(200).json({data: updatedInvoice, msg: "Invoice updated successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not update invoice.' });
        }
    }


    async deleteInvoice (req: Request, res: Response) {
        const { id } = req.params;
        try {
            const invoice = await db.invoice.findUnique({where: {id: parseInt(id, 10)}})

            if (!invoice) return res.status(404).json({ error_code: 404, msg: 'Invoice not found.' });
            await db.invoice.delete({where: {id: parseInt(id, 10)}})
            res.status(200).json({msg: "Invoice deleted successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not delete invoice.' });
        }
    }

}

const invoiceController = new InvoiceController();
export default invoiceController;
