import mongoose from "mongoose";
import Employee from "../models/employee.model.js";

// CREATE
export const createEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body);
    return res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

// READ ALL
export const getEmployees = async (req, res, next) => {
  try {
    const includeDeleted = req.query.includeDeleted === "true";
    const filter = includeDeleted ? {} : { isDeleted: false };

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    return res.json(employees);
  } catch (err) {
    next(err);
  }
};

// READ ONE
export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // optional: prevent CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const includeDeleted = req.query.includeDeleted === "true";
    const filter = includeDeleted
      ? { _id: id }
      : { _id: id, isDeleted: false };

    const employee = await Employee.findOne(filter);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json(employee);
  } catch (err) {
    next(err);
  }
};

// UPDATE
export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json(employee);
  } catch (err) {
    next(err);
  }
};

// SOFT DELETE (deactivate)
export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json({ message: "Employee deactivated", employee });
  } catch (err) {
    next(err);
  }
};

// RESTORE (optional but super useful)
export const restoreEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { isDeleted: false },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found or not deactivated" });
    }

    return res.json({ message: "Employee restored", employee });
  } catch (err) {
    next(err);
  }
};

// PERMANENT DELETE
export const permanentlyDeleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json({
      message: "Employee permanently deleted",
      deletedData: employee,
    });
  } catch (err) {
    next(err);
  }
};
