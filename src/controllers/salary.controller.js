import Salary from '../models/salary.model.js'; // Mongoose model

// Add salary record
export const addSalary = async (req, res) => {
  try {
    const salary = new Salary(req.body);
    await salary.save();
    res.status(201).json(salary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get salary history for employee
export const getSalaryHistory = async (req, res) => {
  try {
    const salaries = await Salary.find({ employeeId: req.params.id });
    if (!salaries) return res.status(404).json({ message: 'No salary records found' });
    res.status(200).json(salaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getSalaries = async (req, res, next) => {
  try {
    const { employeeId } = req.query;

    const filter = employeeId ? { employeeId } : {};

    const salaries = await Salary.find(filter).sort({ createdAt: -1 });
    res.json(salaries);
  } catch (err) {
    next(err);
  }
};

