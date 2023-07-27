import express from 'express';
import router from './routes';
import dotenv from 'dotenv'

import cors from 'cors'

const result = dotenv.config()
export const envs = result.parsed || {}


export const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(cors())
app.use('/api/v1/', router);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
