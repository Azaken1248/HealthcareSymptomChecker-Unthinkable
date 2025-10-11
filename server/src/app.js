import express from 'express';
import cors from 'cors';
import rateLimiter from './middleware/rateLimiter.js';
import symptomRoutes from './api/routes/symptom.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', rateLimiter);
app.use('/api', symptomRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).send('Error! Something went wrong.' + err.message);
});

export default app;