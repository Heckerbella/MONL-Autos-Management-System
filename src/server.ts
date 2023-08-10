import express from 'express';
import router from './routes';
import cors from 'cors'
import { triggerNotification } from './utils/novuModule';
const cron = require('node-cron');



export const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Add PATCH to the allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/v1/', router);

function runTaskAt9AM() {
  // Schedule the task to run every day at 9 AM (server's local time)
  console.log("scheduling cron job")
  cron.schedule('0 9 * * 1-6', () => {
    // This function will be called every day at 9 AM
    console.log('Running the task every day except Sundays at 9 AM in Lagos timezone');
    // Call your function here
    triggerNotification()
  }, {timezone: 'Africa/Lagos'});
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  runTaskAt9AM()
});
