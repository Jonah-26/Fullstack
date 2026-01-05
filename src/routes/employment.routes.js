import express from 'express';
import * as employmentController from '../controllers/employment.controller.js';

const router = express.Router();

router.post('/', employmentController.addEmploymentDetails);
router.get('/:id', employmentController.getEmploymentDetails);

export default router;
