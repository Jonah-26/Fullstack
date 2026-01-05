import LeaveCredit from "../models/leaveCredit.model.js";

// Add or update leave credits
export const upsertLeaveCredit = async (req, res) => {
  try {
    const { employeeId, year } = req.body;

    const credit = await LeaveCredit.findOneAndUpdate(
      { employeeId, year },
      req.body,
      { new: true, upsert: true }
    );

    res.status(200).json(credit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get leave credits per employee
export const getLeaveCredits = async (req, res) => {
  try {
    const credits = await LeaveCredit.find({
      employeeId: req.params.id,
    });

    res.status(200).json(credits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
