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

const app = express();

app.use(cors());
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
    app.use("/api/booking", bookingRouter);
    app.use("/api/staff", routerStaff);
    app.use("/api/attendance", routerAttendance);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startCronJobs();
    });
  })
  .catch((error) => {
    console.log("MongoDB Error:", error);
  });