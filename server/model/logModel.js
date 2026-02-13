import mongoose from "mongoose";

const { Schema } = mongoose;

// Attempt model to support "immutable after submission"
const attemptSchema = new Schema(
    {
        attemptId: { type: String, required: true, unique: true, index: true, immutable: true },
        status: { type: String, enum: ["ACTIVE", "SEALED"], default: "ACTIVE", index: true },
        createdAt: { type: Date, default: Date.now, immutable: true },
        sealedAt: { type: Date, default: null },
        meta: { type: Schema.Types.Mixed, default: {} },
    },
    { minimize: false }
);

// Log model (append-only)
const logSchema = new Schema(
    {
        // optional but strongly recommended for retries/deduping
        eventId: { type: String, default: null, index: true, immutable: true },

        eventType: { type: String, required: true, index: true, immutable: true },
        timestamp: { type: Date, default: Date.now, immutable: true },

        attemptId: { type: String, required: true, index: true, immutable: true },
        questionId: { type: String, required: false, default: null, immutable: true },

        metadata: { type: Schema.Types.Mixed, default: {}, immutable: true },
        receivedAt: { type: Date, default: Date.now, immutable: true },
    },
    { minimize: false }
);

// ✅ Dedupe only when eventId exists (won't break old UI)
// prevents duplicates on retries
logSchema.index(
    { attemptId: 1, eventId: 1 },
    {
        unique: true,
        partialFilterExpression: { eventId: { $type: "string" } },
    }
);

// ✅ Fix OverwriteModelError on reload
export const Attempt =
    mongoose.models.Attempt || mongoose.model("Attempt", attemptSchema);

const AssessmentLog =
    mongoose.models.AssessmentLog || mongoose.model("AssessmentLog", logSchema);

export default AssessmentLog;
