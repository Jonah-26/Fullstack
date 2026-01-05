import mongoose from "mongoose";
import LeaveRequest from "../models/leaveRequest.model.js";
import LeaveCredit from "../models/leaveCredit.model.js";

function daysInclusive(startDate, endDate) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

// FILE LEAVE REQUEST (employee/admin creates)
export const fileLeaveRequest = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const allowedTypes = ["Vacation", "Sick"];
    if (!allowedTypes.includes(leaveType)) {
      return res.status(400).json({ message: "Invalid leaveType" });
    }

    const leave = await LeaveRequest.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason: reason || "",
      status: "Pending", // default
    });

    return res.status(201).json(leave);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET LEAVE REQUESTS (by employee id)
export const getLeaveRequests = async (req, res) => {
  try {
    const { id } = req.params; // employeeId

    const leaves = await LeaveRequest.find({ employeeId: id }).sort({
      createdAt: -1,
    });

    return res.status(200).json(leaves);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



export const updateLeaveRequestStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { status } = req.body;
    const allowed = ["Pending", "Approved", "Rejected"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    session.startTransaction();

    const leave = await LeaveRequest.findById(req.params.id).session(session);
    if (!leave) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Leave request not found" });
    }

    const prevStatus = leave.status;
    leave.status = status;

    // ✅ Only deduct credits when transitioning into Approved
    if (status === "Approved" && prevStatus !== "Approved") {
      const days = daysInclusive(leave.startDate, leave.endDate);
      const year = new Date(leave.startDate).getFullYear();

      const credit = await LeaveCredit.findOne({
        employeeId: leave.employeeId,
        year,
      }).session(session);

      if (!credit) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `No leave credits found for year ${year}. Please set Leave Credits first.`,
        });
      }

      // Optional: prevent going negative / over-using
      if (leave.leaveType === "Vacation") {
        const remaining = credit.vacationLeave - credit.usedVacationLeave;
        if (days > remaining) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Insufficient Vacation Leave. Remaining: ${remaining} day(s).`,
          });
        }
        credit.usedVacationLeave += days;
      }

      if (leave.leaveType === "Sick") {
        const remaining = credit.sickLeave - credit.usedSickLeave;
        if (days > remaining) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Insufficient Sick Leave. Remaining: ${remaining} day(s).`,
          });
        }
        credit.usedSickLeave += days;
      }

      await credit.save({ session });
    }

    // (Optional future feature)
    // If status changes from Approved → Rejected/Pending, you can "refund" credits.
    // We’ll skip for now since you said admin-only and simple.

    await leave.save({ session });

    await session.commitTransaction();
    return res.status(200).json(leave);
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

