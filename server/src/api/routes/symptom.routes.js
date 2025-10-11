import { Router } from 'express';
import { body } from 'express-validator';
import { getSymptomAnalysis } from '../controllers/symptom.controller.js';

const router = Router();

router.post(
  '/check-symptoms',
  [
    body('symptoms')
      .trim()
      .notEmpty().withMessage('Symptoms text cannot be empty.')
      .isLength({ min: 10, max: 750 }).withMessage('Symptoms must be between 10 and 750 characters long.')
      .escape(),
  ],
  getSymptomAnalysis
);

export default router;