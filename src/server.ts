import express from 'express';
import router from './routes';
import cors from 'cors'




export const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Add PATCH to the allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/v1/', router);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
