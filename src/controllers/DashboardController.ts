import { db } from "../../src/utils/prismaClient";
import { Request, Response } from "express";

async function getJobsByMonth() {
  try {
    const jobs = await db.job.findMany({
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Group and count jobs by month and year
    const jobsByMonth = jobs.reduce((acc, job) => {
        const monthYear = job.createdAt.toISOString().slice(0, 7);
        if (acc[monthYear]) {
            acc[monthYear]++;
        } else {
            acc[monthYear] = 1;
        }
        return acc;
    }, {} as { [monthYear: string]: number }); // Type assertion here

    // Convert the result into an array of objects
    const result = Object.entries(jobsByMonth).map(([monthYear, count]) => ({
      month: monthYear,
      jobs: count,
    }));

    return result;
  } catch (error) {
    console.error('Error getting jobs by month:', error);
    return []
  }
}

class DashboardController {
    async getDashboardData (req: Request, res: Response) {
        try {
            const data = {
                total_customer_count: await db.customer.count(),
                total_jobs_count: await db.job.count(),
                total_vehicles_count: await db.vehicle.count(),
                total_customers: await getJobsByMonth(),
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
            // console.log(error);
            res.status(400).json({ error_code: 400, msg: 'Could not retrieve dashboard data.' });
        }

        // let result = await db.customer.
    }
}

const dashboardController = new DashboardController();
export default dashboardController;