import express from 'express';
import * as promotionController from '../controllers/promotion.controller.js';

const router = express.Router();

router.post('/', promotionController.addPromotion);
router.get('/:id', promotionController.getPromotions);

export default router;
