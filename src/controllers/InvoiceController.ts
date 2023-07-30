import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";
import { isValidDate } from "../utils/general";

class InvoiceController {
    async createInvoice (req: Request, res: Response) {
        const {
            job_id,
            amount,
            description,
            due_date,
            customer_id
        } = req.body

        if (
            !job_id || 
            !amount ||
            !customer_id
        ) {
            return res.status(400).json({ error_code: 400, msg: 'Missing information.' });
        }

        if (due_date && !isValidDate(due_date)) return res.status(400).json({ error_code: 400, msg: 'Incorrect Date format for due_date. Please use the date format YYYY-MM-DD.' });

        try {
            const job = await db.job.findUnique({where: {id: parseInt(job_id, 10)}, select: { invoice: true}})
            const customer = await db.customer.findUnique({where: {id: parseInt(customer_id, 10)}})

            if (!customer) return res.status(404).json({ error_code: 404, msg: 'Customer not found.' });
            if (!job) return res.status(404).json({ error_code: 404, msg: 'Job not found.' });
            if (job.invoice) return res.status(400).json({ error_code: 400, msg: 'Invoice already exists for this job.' });

            const invoice = await db.invoice.create({
                data: {
                    jobID: parseInt(job_id, 10),
                    customerID: parseInt(customer_id, 10),
                    amount: parseFloat(amount),
                    description,
                    dueDate: due_date ? (new Date(due_date)).toISOString() : null
                }
            })
            res.status(201).json({data: invoice, msg: "Invoice created successfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not create invoice.' });
        }
    }

    async getInvoices (req: Request, res: Response) {
        try {
            const invoices = await db.invoice.findMany();
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
                    job: {
                        select: {
                            id: true,
                            estimate: true,
                            jobType: {
                                select: {
                                    name: true
                                }
                            },
                            vehicle: {
                                select: {
                                    modelName: true,
                                    modelNo: true,
                                    licensePlate: true,
                                    vehicleType: {
                                        select: {
                                            name: true
                                        }
                                    }

                                }
                            }
                        }
                    },
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
            amount,
            description,
            due_date,
            paid
        } = req.body
        
        try {
            const invoice = await db.invoice.findUnique({where: {id: parseInt(id, 10)}})

            if (!invoice) return res.status(404).json({ error_code: 404, msg: 'Invoice not found.' });
            const data: {[key: string]: number | string} = {}
    
            if (due_date && !isValidDate(due_date)) return res.status(400).json({ error_code: 400, msg: 'Incorrect Date format for due_date. Please use the date format YYYY-MM-DD.' });
            if (due_date) data['dueDate'] = (new Date(due_date)).toISOString()
            if (amount) data['amount'] = parseFloat(amount)
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