import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import rateLimiter from './middleware/rateLimiter.js';
import symptomRoutes from './api/routes/symptom.routes.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.nodeEnv === 'production' ? 1 : false);

app.use(
  cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: config.requestBodyLimit }));
app.use(express.urlencoded({ extended: false, limit: config.requestBodyLimit }));

app.use('/api', rateLimiter);
app.use('/api', symptomRoutes);

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  const statusCode = error.statusCode ?? error.status ?? 500;
  const message = config.nodeEnv === 'production' ? 'Internal server error.' : error.message;

  res.status(statusCode).json({ message });
});

export default app;