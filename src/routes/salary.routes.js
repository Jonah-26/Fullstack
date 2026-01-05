import express from "express";
import * as salaryController from "../controllers/salary.controller.js";

const router = express.Router();

router.post("/", salaryController.addSalary);

// ✅ add this (list all OR filter by employeeId)
router.get("/", salaryController.getSalaries);

// existing (salary history for one employee)
router.get("/:id", salaryController.getSalaryHistory);

export default router;
