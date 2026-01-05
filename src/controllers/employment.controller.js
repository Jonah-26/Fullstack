import Employment from "../models/employment.model.js";

// Add employment details
export const addEmploymentDetails = async (req, res) => {
  try {
    const employment = await Employment.create(req.body);
    return res.status(201).json(employment);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get employment details by employee ID
export const getEmploymentDetails = async (req, res) => {
  try {
    const details = await Employment.find({ employeeId: req.params.id }).sort({
      createdAt: -1,
    });

    // return empty array (frontend handles empty state nicely)
    return res.status(200).json(details);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
