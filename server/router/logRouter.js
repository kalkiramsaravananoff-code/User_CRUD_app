import express from "express";
import {
    createLog,
    batchLogs,
    getLogsByAttempt,
    sealAttempt,
    createFrontendLogBatch,
} from "../controller/logController.js";

const router = express.Router();

// Single log
router.post("/", createLog);

// Batch (supports {logs:[]} OR {attemptId, events:[]})
router.post("/batch", batchLogs);

// Optional explicit frontend endpoint (if UI uses this name)
router.post("/frontend-batch", createFrontendLogBatch);

// Review attempt logs
router.get("/:attemptId", getLogsByAttempt);

// Seal attempt (immutability after submission)
router.post("/attempt/:attemptId/seal", sealAttempt);

export default router;
