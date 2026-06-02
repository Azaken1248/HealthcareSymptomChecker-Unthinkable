import { Router } from 'express';
import { body } from 'express-validator';
import { getSymptomAnalysis, getQueryHistory } from '../controllers/symptom.controller.js';
import verifyToken from '../../middleware/authMiddleware.js';

const router = Router();

router.post(
  '/check-symptoms',
  verifyToken,
  [
    body('symptoms')
      .isString().withMessage('Symptoms must be provided as text.')
      .trim()
      .notEmpty().withMessage('Symptoms text cannot be empty.')
      .isLength({ min: 10, max: 750 }).withMessage('Symptoms must be between 10 and 750 characters long.')
  ],
  getSymptomAnalysis
);

router.get('/history', verifyToken, getQueryHistory);

export default router;