import mongoose from "mongoose";

const leaveCreditSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    vacationLeave: { type: Number, default: 15 },
    sickLeave: { type: Number, default: 10 },

    usedVacationLeave: { type: Number, default: 0 },
    usedSickLeave: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// prevent duplicate credits per employee per year
leaveCreditSchema.index({ employeeId: 1, year: 1 }, { unique: true });

const LeaveCredit = mongoose.model("LeaveCredit", leaveCreditSchema);
export default LeaveCredit;
