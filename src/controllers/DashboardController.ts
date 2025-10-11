import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";

// A generic function to fetch and count records by their creation month
async function getCountByMonth(model: 'job' | 'vehicle' | 'customer', countName: string) {
  try {
    // Dynamically select the Prisma model to query
    const records = await (db as any)[model].findMany({
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Group and count records by month and year
    const recordsByMonth = records.reduce((acc: { [monthYear: string]: number }, record: { createdAt: Date }) => {
        const monthYear = record.createdAt.toISOString().slice(0, 7); // YYYY-MM format
        if (acc[monthYear]) {
            acc[monthYear]++;
        } else {
            acc[monthYear] = 1;
        }
        return acc;
    }, {});

    // Convert the result into an array of objects
    const result = Object.entries(recordsByMonth).map(([monthYear, count]) => ({
      month: monthYear,
      [countName]: count, // Use the dynamic countName for the key (e.g., 'jobs', 'vehicles', 'customers')
    }));

    return result;
  } catch (error) {
    console.error(`Error getting ${model}s by month:`, error);
    return [];
  }
}

// Specialized function for jobs by month, calling the generic one
async function getJobsByMonth() {
    // The original function name will be 'jobs'
    return getCountByMonth('job', 'jobs'); 
}

// New function for vehicles by month
async function getVehiclesByMonth() {
    // The original function name will be 'vehicles'
    return getCountByMonth('vehicle', 'vehicles');
}

// New function for customers by month
async function getCustomersByMonth() {
    // The original function name will be 'customers'
    return getCountByMonth('customer', 'customers');
}

class DashboardController {
    async getDashboardData (req: Request, res: Response) {
        try {
            const data = {
                total_customer_count: await db.customer.count(),
                total_jobs_count: await db.job.count(),
                total_vehicles_count: await db.vehicle.count(),
                //total_customers: await getJobsByMonth(),

                total_jobs: await getJobsByMonth(), // Reusing the original, now based on generic
                total_vehicles: await getVehiclesByMonth(), // New payload
                total_customers: await getCustomersByMonth(),

                invoice_history: await db.invoice.findMany({ 
                    select: {
                        invoiceNo: true,
                        amount: true,
                        createdAt: true
                    }
                })
            }

            res.status(200).json({data, msg: "Dashboard data retrieved successfully."});
            
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Could not retrieve dashboard data.' });
        }
    }
}

const dashboardController = new DashboardController();
export default dashboardController;
