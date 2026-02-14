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

/* -------------------------- Serve React build ------------------------- */
/**
 * IMPORTANT:
 * Your backend runs from /server
 * Your frontend build output is /client/dist
 * So in production we must serve ../client/dist
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDist = path.join(__dirname, "..", "client", "dist");
const indexHtml = path.join(clientDist, "index.html");

if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientDist));

  // SPA fallback (BrowserRouter refresh fix)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
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
