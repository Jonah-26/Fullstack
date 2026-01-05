import Promotion from '../models/promotion.model.js'; // Mongoose model

// Add promotion record
export const addPromotion = async (req, res) => {
  try {
    const promotion = new Promotion(req.body);
    await promotion.save();
    res.status(201).json(promotion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get promotion history
export const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({ employeeId: req.params.id });
    if (!promotions) return res.status(404).json({ message: 'No promotion records found' });
    res.status(200).json(promotions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
