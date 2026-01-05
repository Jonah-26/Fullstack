import Employee from "../models/employee.model.js";
import LeaveRequest from "../models/leaveRequest.model.js";
import LeaveCredit from "../models/leaveCredit.model.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const [total, active, deactivated] = await Promise.all([
      Employee.countDocuments({}),
      Employee.countDocuments({ isDeleted: { $ne: true } }),
      Employee.countDocuments({ isDeleted: true }),
    ]);

    const [pending, approved, rejected] = await Promise.all([
      LeaveRequest.countDocuments({ status: "Pending" }),
      LeaveRequest.countDocuments({ status: "Approved" }),
      LeaveRequest.countDocuments({ status: "Rejected" }),
    ]);

    const leaveCreditRecords = await LeaveCredit.countDocuments({});

    return res.status(200).json({
      employees: { total, active, deactivated },
      leaveRequests: { pending, approved, rejected },
      leaveCredits: { records: leaveCreditRecords },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
