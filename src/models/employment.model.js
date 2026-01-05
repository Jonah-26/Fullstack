import mongoose from 'mongoose';

const employmentSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  department: { type: String, required: true },
  position: { type: String, required: true },
  employmentStatus: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  dateHired: { type: Date, required: true }
}, { timestamps: true });

const Employment = mongoose.model('Employment', employmentSchema);
export default Employment;
