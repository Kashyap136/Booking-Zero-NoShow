import express from "express";

import {
  createBooking,
  getBookings,
  getBookingStats,
  updateBookingStatus,
} from "../controllers/bookingController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create booking
router.post("/create",  createBooking);

// Booking list
router.get("/list", authMiddleware, getBookings);

// Booking stats
router.get("/stats", authMiddleware, getBookingStats);

// Update status
router.post("/status", authMiddleware, updateBookingStatus);

export default router;
