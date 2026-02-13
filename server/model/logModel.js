import mongoose from "mongoose";

const { Schema } = mongoose;

/* ------------------------- Event subdocument ------------------------- */
const eventSchema = new Schema(
    {
        eventId: { type: String, default: null },
        eventType: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        questionId: { type: String, default: null },
        metadata: { type: Schema.Types.Mixed, default: {} },
        receivedAt: { type: Date, default: Date.now },
    },
    { _id: false, minimize: false }
);

/* ------------------------------ Attempt ------------------------------ */
const attemptSchema = new Schema(
    {
        attemptId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            immutable: true,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "SEALED"],
            default: "ACTIVE",
            index: true,
        },
        createdAt: { type: Date, default: Date.now, immutable: true },
        sealedAt: { type: Date, default: null },
        meta: { type: Schema.Types.Mixed, default: {} },

        // ✅ THIS is what you want: store all logs per session here
        events: { type: [eventSchema], default: [] },
    },
    { minimize: false }
);

export const Attempt =
    mongoose.models.Attempt || mongoose.model("Attempt", attemptSchema);

/**
 * Keep AssessmentLog model only if you want to keep old data.
 * We will NOT write into it after controller update.
 */
const logSchema = new Schema(
    {
        eventId: { type: String, default: null, index: true, immutable: true },
        eventType: { type: String, required: true, index: true, immutable: true },
        timestamp: { type: Date, default: Date.now, immutable: true },
        attemptId: { type: String, required: true, index: true, immutable: true },
        questionId: { type: String, default: null, immutable: true },
        metadata: { type: Schema.Types.Mixed, default: {}, immutable: true },
        receivedAt: { type: Date, default: Date.now, immutable: true },
    },
    { minimize: false }
);

const AssessmentLog =
    mongoose.models.AssessmentLog || mongoose.model("AssessmentLog", logSchema);

export default AssessmentLog;
