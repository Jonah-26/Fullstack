import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  department: { type: String },
  position: { type: String },
  dateHired: { type: Date },
  salary: { type: Number },
  isDeleted: { type: Boolean, default: false } // soft delete
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
