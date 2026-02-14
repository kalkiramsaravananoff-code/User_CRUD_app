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

/* ----------------------------- middleware ----------------------------- */
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* -------------------------------- APIs -------------------------------- */
app.use("/api/user", userrouter);
app.use("/api/logs", logRouter);

/* -------------------------- serve frontend (SPA) ------------------------ */
/**
 * This fixes: /test works by clicking, but refresh gives 404.
 * We serve the built frontend and always return index.html for non-API routes.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// try common build locations
const candidateBuildDirs = [
  path.join(__dirname, "dist"),
  path.join(__dirname, "client", "dist"),
  path.join(__dirname, "frontend", "dist"),
  path.join(__dirname, "public"),
];

const buildDir = candidateBuildDirs.find((p) => fs.existsSync(p));

if (buildDir) {
  app.use(express.static(buildDir));

  // ✅ SPA fallback (exclude /api)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(buildDir, "index.html"));
  });
} else {
  console.warn(
    "⚠️ Frontend build folder not found. Build your React app (vite build) and ensure dist exists."
  );
}

/* ------------------------------ 404 for APIs ---------------------------- */
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
