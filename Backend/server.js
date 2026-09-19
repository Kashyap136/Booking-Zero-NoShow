import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/auth.js";
import service from "./routes/service.js";
import bookingRouter from "./routes/booking.js";
import routerStaff from "./routes/staff.js";
import routerAttendance from "./routes/attendance.js";
import { startCronJobs } from "./cron.js";
import whatsappRouter from "./routes/whatsapp.js";

// ---------------------------------------------------------------------------
// Startup environment validation
// ---------------------------------------------------------------------------
const REQUIRED_ENV = ["MONGO_URL", "JWT_SECRET"];

const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());

if (missingEnv.length > 0) {
  console.error(
    "[STARTUP] Missing required environment variable" +
      (missingEnv.length > 1 ? "s" : "") +
      ": " +
      missingEnv.join(", ")
  );
  console.error(
    "[STARTUP] Copy Backend/.env.example to Backend/.env and fill in the values before starting."
  );
  process.exit(1);
}

const app = express();

// CORS: allow a configurable list of browser origins in production.
// When CORS_ORIGIN is unset, fall back to allowing any origin (local development).
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : null;

app.use(cors(configuredOrigins ? { origin: configuredOrigins } : {}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Booking OS API running",
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");

    app.use("/api/auth", authRoutes);
    app.use("/api/service", service);
    app.use("/api/services", service);
    app.use("/api/booking", bookingRouter);
    app.use("/api/bookings", bookingRouter);
    app.use("/api/staff", routerStaff);
    app.use("/api/attendance", routerAttendance);
    app.use(
  "/api/whatsapp",
  whatsappRouter
);

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startCronJobs();
    });

    const gracefulShutdown = (signal) => {
      console.log(`[SHUTDOWN] Received ${signal}, closing server...`);

      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log("[SHUTDOWN] MongoDB connection closed. Exiting.");
          process.exit(0);
        });
      });

      setTimeout(() => {
        console.error("[SHUTDOWN] Forced exit after timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  })
  .catch((error) => {
    console.error("[STARTUP] MongoDB connection failed:", error.message);
    process.exit(1);
  });