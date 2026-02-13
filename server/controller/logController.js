import { Attempt } from "../model/logModel.js";

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
    // create attempt if not exists
    await Attempt.updateOne(
        { attemptId },
        { $setOnInsert: { attemptId, status: "ACTIVE", createdAt: new Date() } },
        { upsert: true }
    );

    const attempt = await Attempt.findOne({ attemptId }).select("status").lean();
    if (attempt?.status === "SEALED") {
        const err = new Error("Attempt is SEALED. No more logs accepted.");
        err.statusCode = 409;
        throw err;
    }
}

function normalizeEvent(raw, fallbackAttemptId) {
    const attemptId = String(raw?.attemptId || fallbackAttemptId || "").trim();
    if (!attemptId) return { ok: false };

    const eventType = String(raw?.eventType || raw?.type || "").trim();
    if (!eventType) return { ok: false };

    return {
        ok: true,
        doc: {
            eventId: raw?.eventId ? String(raw.eventId).trim() : null,
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
        const { eventType, attemptId, questionId, metadata, timestamp, eventId } =
            req.body;

        if (!eventType || !attemptId) {
            return res
                .status(400)
                .json({ success: false, message: "eventType and attemptId are required." });
        }

        const id = String(attemptId).trim();
        await ensureAttemptActive(id);

        const newEvent = normalizeEvent(
            { eventType, attemptId: id, questionId, metadata, timestamp, eventId },
            id
        ).doc;

        const result = await Attempt.updateOne(
            { attemptId: id, status: { $ne: "SEALED" } },
            { $push: { events: newEvent } }
        );

        if (result.matchedCount === 0) {
            return res.status(409).json({ success: false, message: "Attempt not found or sealed." });
        }

        return res
            .status(201)
            .json({ success: true, message: "Log created successfully", event: newEvent });
    } catch (error) {
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

        const inferredAttemptId = attemptId || items?.[0]?.attemptId;
        if (!inferredAttemptId) {
            return res.status(400).json({
                success: false,
                message: "attemptId is required (body or per log item).",
            });
        }

        const id = String(inferredAttemptId).trim();
        await ensureAttemptActive(id);

        const normalizedEvents = [];
        let rejected = 0;

        for (const raw of items) {
            const n = normalizeEvent(raw, id);
            if (!n.ok) {
                rejected++;
                continue;
            }
            normalizedEvents.push(n.doc);
        }

        if (normalizedEvents.length === 0) {
            return res.status(400).json({ success: false, message: "No valid logs found in batch." });
        }

        const result = await Attempt.updateOne(
            { attemptId: id, status: { $ne: "SEALED" } },
            { $push: { events: { $each: normalizedEvents } } }
        );

        if (result.matchedCount === 0) {
            return res.status(409).json({ success: false, message: "Attempt not found or sealed." });
        }

        return res.status(201).json({
            success: true,
            message: "Batch logs created successfully",
            attemptId: id,
            received: items.length,
            inserted: normalizedEvents.length,
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

// GET /api/logs/:attemptId  ✅ NOW returns Attempt.events
export const getLogsByAttempt = async (req, res) => {
    try {
        const attemptId = String(req.params.attemptId || "").trim();
        if (!attemptId) {
            return res.status(400).json({ success: false, message: "Attempt ID is required." });
        }

        const attempt = await Attempt.findOne({ attemptId }).lean();
        if (!attempt) {
            return res.status(404).json({ success: false, message: "Attempt not found." });
        }

        return res.status(200).json({
            success: true,
            attempt,
            count: attempt.events?.length || 0,
            events: attempt.events || [],
        });
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
