import Credential from '../models/credential.model.js'; // Mongoose model

// Add credential record
export const addCredential = async (req, res) => {
  try {
    const credential = new Credential(req.body);
    await credential.save();
    res.status(201).json(credential);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all credentials for employee
export const getCredentials = async (req, res) => {
  try {
    const credentials = await Credential.find({ employeeId: req.params.id });
    if (!credentials) return res.status(404).json({ message: 'No credentials found' });
    res.status(200).json(credentials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


