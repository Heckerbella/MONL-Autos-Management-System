import { db } from "../utils/prismaClient";
import { Request, Response } from "express";

class CustomerController {
    async createCustomer(req: Request, res: Response) {
        const {
            first_name,
            last_name,
            other_name,
            email,
            billing_address,
            company_contact,
            company_name,
            phone,
            customer_type_id
        } = req.body;

        if (
            !customer_type_id || !first_name || !last_name || !email || !billing_address || !phone
            ) {
                return res.status(400).json({ error_code: 400, msg: 'Missing information.' });
            } else if ((company_name  && !company_contact) || (!company_name && company_contact)) {
                return res.status(400).json({ error_code: 400, msg: 'Company information is incomplete.' });
            } else {
                try {
                    let customer = await db.customer.findUnique({where: {email}})
                    let customerType = await db.customerType.findUnique({where: {id: customer_type_id}})
        
                    if (customer) {
                        return res.status(400).json({ error_code: 400, msg: 'Customer already exists.' });
                    }

                    if (!customerType) {
                        return res.status(400).json({ error_code: 400, msg: 'Customer type does not exist.' });
                    }
                    customer = await db.customer.create({
                        data: {
                            firstName: first_name,
                            lastName: last_name,
                            otherName: other_name,
                            email,
                            billingAddress: billing_address,
                            companyContact: company_contact,
                            companyName: company_name,
                            phone,
                            customerTypeID: parseInt(customer_type_id, 10)
                        }
                    })
        
                    if (customer) {
                        res.status(201).json({data: customer, msg: "Customer Created Sucessfully."});
                    }
                    
                } catch (error) {
                    console.log(error)
                    res.status(400).json({ error_code: 400, msg: 'Could not create customer' });
                }
            }

    }

    async getCustomers(req: Request, res: Response) {
        try {
            const customers = await db.customer.findMany();
            res.status(200).json({data: customers});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not get customers.' });
        }
    }

    async getCustomer(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const customer = await db.customer.findUnique({ where: { id: parseInt(id, 10) } });
            if (!customer) {
                return res.status(404).json({ error_code: 404, msg: 'Customer not found.' });
            }
            res.status(200).json({data: customer});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not get customer.' });
        }
    }

    async updateCustomer(req: Request, res: Response) {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            other_name,
            email,
            billing_address,
            company_contact,
            company_name,
            phone,
            customer_type_id
        } = req.body;
        
        const customer = await db.customer.findUnique({where: {id: parseInt(id, 10)}})

        if (!customer) return res.status(404).json({ error_code: 404, msg: 'Customer not found.' });
        const data: {[key: string]: string | number} = {}
        if (first_name) {
            data.first_name = first_name;
        }
        if (last_name) {
            data.last_name = last_name;
        }
        if (other_name) {
            data.other_name = other_name;
        }
        if (email) {
            const customer = await db.customer.findUnique({where: {email}})
            if(customer && customer.id !== parseInt(id, 10)) 
                return res.status(400).json({ error_code: 400, msg: 'Email already in use by a different Customer.' });
            data.email = email;
        }
        if (billing_address) {
            data.billingAddress = billing_address;
        }
        if (company_contact) {
            data.companyContact = company_contact;
        }
        if (company_name) {
            data.companyName = company_name;
        }
        if (phone) {
            data.phone = phone;
        }
        if (customer_type_id) {
            const customerType = await db.customerType.findUnique({where: {id: customer_type_id}})
            if (!customerType) return res.status(400).json({ error_code: 400, msg: 'Customer type does not exist.' });
            data.customerTypeID = parseInt(customer_type_id, 10);
        }

        try {
            const updatedCustomer = await db.customer.update({
                where: { id: parseInt(id, 10) },
                data
            });
            res.status(200).json(updatedCustomer);
        } catch (error) {
            console.error(error)
            res.status(400).json({ error_code: 400, msg: 'Could not update customer.' });
        }
    }

    async deleteCustomer(req: Request, res: Response) {
        const { id } = req.params;
        const customer = await db.customer.findUnique({where: {id: parseInt(id, 10)}})
        if (!customer) return res.status(404).json({ error_code: 404, msg: 'Customer not found.' });
        try {
            const deletedCustomer = await db.customer.delete({ where: { id: parseInt(id, 10) } });
            res.status(200).json({data: deletedCustomer, msg:"Customer Deleted Sucessfully."});
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not delete customer.' });
        }
    }

}

const customerController = new CustomerController();
export default customerController;
