import AssessmentLog, { Attempt } from "../model/logModel.js";

const MAX_BATCH = 500;

function toDate(v) {
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? new Date() : d;
}

function clampMetadata(meta, maxBytes = 16000) {
    if (!meta || typeof meta !== "object") return {};
    try {
        const s = JSON.stringify(meta);
        if (Buffer.byteLength(s, "utf8") <= maxBytes) return meta;
        return { _clamped: true, _bytes: Buffer.byteLength(s, "utf8") };
    } catch {
        return { _clamped: true };
    }
}

async function ensureAttemptActive(attemptId) {
    await Attempt.updateOne(
        { attemptId },
        { $setOnInsert: { attemptId, status: "ACTIVE", createdAt: new Date() } },
        { upsert: true }
    );

    const attempt = await Attempt.findOne({ attemptId }).lean();
    if (attempt?.status === "SEALED") {
        const err = new Error("Attempt is SEALED. No more logs accepted.");
        err.statusCode = 409;
        throw err;
    }
    return attempt;
}

function normalizeLog(raw, fallbackAttemptId) {
    const attemptId = String(raw?.attemptId || fallbackAttemptId || "").trim();
    if (!attemptId) return { ok: false };

    const eventType = String(raw?.eventType || raw?.type || "").trim();
    if (!eventType) return { ok: false };

    const eventId = raw?.eventId ? String(raw.eventId).trim() : null;

    return {
        ok: true,
        doc: {
            eventId,
            eventType,
            attemptId,
            questionId: raw?.questionId ? String(raw.questionId) : null,
            timestamp: toDate(raw?.timestamp || raw?.ts || Date.now()),
            metadata: clampMetadata(raw?.metadata || raw?.meta || {}, 16000),
            receivedAt: new Date(),
        },
    };
}

// POST /api/logs  (single)
export const createLog = async (req, res) => {
    try {
        const { eventType, attemptId, questionId, metadata, timestamp, eventId } = req.body;

        if (!eventType || !attemptId) {
            return res
                .status(400)
                .json({ success: false, message: "eventType and attemptId are required." });
        }

        await ensureAttemptActive(String(attemptId).trim());

        const newLog = new AssessmentLog({
            eventId: eventId ? String(eventId) : null,
            eventType: String(eventType),
            attemptId: String(attemptId),
            questionId: questionId ? String(questionId) : null,
            metadata: clampMetadata(metadata || {}, 16000),
            timestamp: toDate(timestamp || Date.now()),
            receivedAt: new Date(),
        });

        await newLog.save();
        return res.status(201).json({ success: true, message: "Log created successfully", log: newLog });
    } catch (error) {
        // ✅ IMPORTANT: duplicate key should not be a 500
        if (error?.code === 11000) {
            return res.status(200).json({
                success: true,
                message: "Duplicate log ignored",
                duplicate: true,
            });
        }

        console.error("Error creating log:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

// POST /api/logs/batch  (accepts {logs:[]} OR {attemptId, events:[]})
export const batchLogs = async (req, res) => {
    try {
        // Support both schemas
        const attemptId = String(req.body?.attemptId || "").trim();
        const logsArray = Array.isArray(req.body?.logs) ? req.body.logs : null;
        const eventsArray = Array.isArray(req.body?.events) ? req.body.events : null;

        const items = logsArray || eventsArray;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "logs/events array is required and cannot be empty.",
            });
        }

        if (items.length > MAX_BATCH) {
            return res.status(413).json({
                success: false,
                message: `Batch too large. Max ${MAX_BATCH}`,
            });
        }

        // attemptId can be in body OR per-item
        const inferredAttemptId = attemptId || items?.[0]?.attemptId;
        if (!inferredAttemptId) {
            return res.status(400).json({
                success: false,
                message: "attemptId is required (body or per log item).",
            });
        }

        await ensureAttemptActive(String(inferredAttemptId).trim());

        let rejected = 0;
        const docs = [];

        for (const raw of items) {
            const n = normalizeLog(raw, inferredAttemptId);
            if (!n.ok) {
                rejected += 1;
                continue;
            }
            docs.push(n.doc);
        }

        if (docs.length === 0) {
            return res.status(400).json({ success: false, message: "No valid logs found in batch." });
        }

        let inserted = 0;
        let duplicates = 0;

        try {
            // ✅ ordered:false = continue inserting even if some fail
            const insertedLogs = await AssessmentLog.insertMany(docs, { ordered: false });
            inserted = insertedLogs.length;
        } catch (err) {
            /**
             * Your actual error shape was:
             * err.errorResponse.writeErrors[i].err.code === 11000
             * So we must read BOTH paths.
             */
            const writeErrors = err?.writeErrors || err?.errorResponse?.writeErrors || [];

            const codes = writeErrors.map((e) => e?.code ?? e?.err?.code);

            duplicates = codes.filter((c) => c === 11000).length;
            const hasNonDup = codes.some((c) => c && c !== 11000);

            // If we couldn't parse errors OR there is any non-dup error => real failure
            if (!writeErrors.length || hasNonDup) {
                console.error("Batch insert error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Server error while inserting logs.",
                    error: err?.message,
                });
            }

            // Only duplicate errors happened
            inserted = docs.length - writeErrors.length;
        }

        return res.status(201).json({
            success: true,
            message: "Batch logs created successfully",
            attemptId: inferredAttemptId,
            received: items.length,
            inserted,
            duplicates,
            rejected,
        });
    } catch (error) {
        console.error("Error creating batch logs:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

// alias: POST /api/logs/frontend-batch
export const createFrontendLogBatch = batchLogs;

// GET /api/logs/:attemptId
export const getLogsByAttempt = async (req, res) => {
    try {
        const { attemptId } = req.params;
        if (!attemptId) {
            return res.status(400).json({ success: false, message: "Attempt ID is required." });
        }

        const logs = await AssessmentLog.find({ attemptId: String(attemptId).trim() })
            .sort({ timestamp: 1 })
            .lean();

        const attempt = await Attempt.findOne({ attemptId: String(attemptId).trim() }).lean();

        return res.status(200).json({ success: true, attempt, count: logs.length, logs });
    } catch (error) {
        console.error("Error fetching logs:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// POST /api/logs/attempt/:attemptId/seal
export const sealAttempt = async (req, res) => {
    try {
        const attemptId = String(req.params.attemptId || "").trim();
        if (!attemptId) {
            return res.status(400).json({ success: false, message: "Attempt ID is required." });
        }

        const attempt = await Attempt.findOneAndUpdate(
            { attemptId },
            {
                $set: { status: "SEALED", sealedAt: new Date() },
                $setOnInsert: { attemptId, createdAt: new Date() },
            },
            { new: true, upsert: true }
        ).lean();

        return res.status(200).json({ success: true, message: "Attempt sealed", attempt });
    } catch (error) {
        console.error("Error sealing attempt:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
