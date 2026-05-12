import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config, assertConfig } from "./config.js";
import { authRoutes } from "./routes/authRoutes.js";
import { scanRoutes } from "./routes/scanRoutes.js";
import { engineHealthCheck } from "./services/flaskSecurityClient.js";

assertConfig();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", async (_req, res) => {
  let engine = null;
  try {
    engine = await engineHealthCheck();
  } catch {
    engine = { ok: false };
  }
  res.json({
    status: "ok",
    service: "ai-code-security-auditor-api",
    engine,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/scans", scanRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
