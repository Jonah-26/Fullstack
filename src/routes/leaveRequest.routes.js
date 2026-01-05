import express from "express";
import * as controller from "../controllers/leaveRequest.controller.js";

const router = express.Router();

router.post("/", controller.fileLeaveRequest);
router.get("/:id", controller.getLeaveRequests);
router.patch("/:id/status", controller.updateLeaveRequestStatus);

export default router;
