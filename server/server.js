import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import connectDB from "./config/database.js";
import userrouter from "./router/userrouter.js";
import logRouter from "./router/logRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ----------------------------- Middleware ----------------------------- */
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ------------------------------- API Routes --------------------------- */
app.use("/api/user", userrouter);
app.use("/api/logs", logRouter);

/* ✅ API error handler (so API never returns HTML) */
app.use("/api", (err, req, res, next) => {
  console.error("API error:", err);
  res.status(500).json({ success: false, error: err?.message || "Server error" });
});

/* ✅ API 404 (so /api fallthrough never hits SPA) */
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, error: "API route not found" });
});

/* -------------------------- Serve React build ------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDist = path.join(__dirname, "..", "client", "dist");
const indexHtml = path.join(clientDist, "index.html");

if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientDist));

  // ✅ SPA fallback (only for non-API)
  app.get("*", (req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  console.warn("⚠️ React build not found:", indexHtml);
  console.warn("⚠️ Run client build during deploy so /client/dist exists.");
}

/* ------------------------------ Start Server -------------------------- */
async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
