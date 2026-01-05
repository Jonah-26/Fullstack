import express from "express";
import * as controller from "../controllers/leaveCredit.controller.js";

const router = express.Router();

router.post("/", controller.upsertLeaveCredit);
router.get("/:id", controller.getLeaveCredits);

export default router;
