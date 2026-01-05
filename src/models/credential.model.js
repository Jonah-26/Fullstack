import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  credentialName: { type: String, required: true },
  issuedBy: { type: String, required: true },
  issuedDate: { type: Date },
  expiryDate: { type: Date }
}, { timestamps: true });

const Credential = mongoose.model('Credential', credentialSchema);
export default Credential;
