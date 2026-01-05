import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  oldPosition: { type: String, required: true },
  newPosition: { type: String, required: true },
  promotionDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;
