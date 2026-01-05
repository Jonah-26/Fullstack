import express from "express";
import * as employeeController from "../controllers/employee.controller.js";

const router = express.Router();

router.post("/", employeeController.createEmployee);
router.get("/", employeeController.getEmployees);
router.get("/:id", employeeController.getEmployeeById);
router.put("/:id", employeeController.updateEmployee);

// deactivate (soft delete)
router.patch("/:id", employeeController.deleteEmployee);

// restore (optional but recommended)
router.patch("/:id/restore", employeeController.restoreEmployee);

router.delete("/permanent/:id", employeeController.permanentlyDeleteEmployee);

export default router;
