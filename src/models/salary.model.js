import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  salaryAmount: { type: Number, required: true },
  effectiveDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;
