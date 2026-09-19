import Booking from "../models/bookingModel.js";
import Service from "../models/serviceModel.js";
import Staff from "../models/staffModel.js";

export const createBooking = async (req, res) => {
  try {
    const { companyId, customerName, phone, serviceId, bookingDate, slot } =
      req.body;

    // Required fields
    if (
      !companyId ||
      !customerName ||
      !phone ||
      !serviceId ||
      !bookingDate ||
      !slot
    ) {
      return res.status(400).json({
        message:
          "companyId, customerName, phone, serviceId, bookingDate and slot are required",
      });
    }

    // Find service
    const service = await Service.findOne({
      _id: serviceId,
      companyId,
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    // Get staff from service
    const staffId = service.staffId;

    if (!staffId) {
      return res.status(400).json({
        message: "No staff assigned to this service",
      });
    }

    // Check existing booking
    const existingBooking = await Booking.findOne({
      staffId,
      bookingDate,
      slot,
    });

    if (existingBooking) {
      return res.status(409).json({
        message: "Slot booked",
      });
    }

    // Calculate amount
    const totalAmount = service.price;
    const advanceAmount = totalAmount * 0.2;

    // Create booking
    const booking = await Booking.create({
      companyId,
      customerName,
      phone,
      serviceId,
      staffId,
      bookingDate,
      slot,
      totalAmount,
      advanceAmount,
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.log("Create booking error:", error);

    // Duplicate booking protection
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Slot booked",
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getBookings = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    const bookings = await Booking.find({ companyId, bookingDate: date })
      .populate("serviceId", "title price durationMins")
      .populate("staffId", "name email")
      .sort({ slot: 1 });

    const normalized = bookings.map((booking) => ({
      ...booking.toObject(),
      id: booking._id.toString(),
      serviceName: booking.serviceId?.title || "",
      staffName: booking.staffId?.name || "",
    }));

    return res
      .status(200)
      .json({ date, count: bookings.length, bookings: normalized });
  } catch (error) {
    console.log("Get bookings error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getBookingStats = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    const bookings = await Booking.find({ companyId, bookingDate: date });
    const total = bookings.length;
    const completed = bookings.filter(
      (booking) => booking.status === "completed",
    ).length;
    const noShow = bookings.filter(
      (booking) => booking.status === "no-show",
    ).length;
    const revenue = bookings
      .filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    return res
      .status(200)
      .json({ date, stats: { total, completed, noShow, revenue } });
  } catch (error) {
    console.log("Booking stats error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const companyId = req.companyId;

    const { bookingId, status } = req.body;

    // 1. Validate input
    if (!bookingId || !status) {
      return res.status(400).json({
        message: "bookingId and status are required",
      });
    }

    // 2. Allowed statuses
    const allowedStatuses = ["booked", "completed", "no-show", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be booked, completed, no-show or cancelled",
      });
    }

    // 3. Find booking for this company
    const booking = await Booking.findOne({
      _id: bookingId,
      companyId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // 4. No-show
    if (status === "no-show") {
      // Guard against double-charging the advance when a booking is
      // already marked as no-show.
      if (booking.status === "no-show") {
        return res.status(200).json({
          message: "Booking was already marked as no-show. No additional charge.",
          bookingId: booking._id,
          status: booking.status,
          advanceAmount: booking.advanceAmount,
        });
      }

      booking.status = "no-show";

      // Advance amount was already calculated
      // during booking creation (20%).
      const chargedAdvance = booking.advanceAmount;

      await booking.save();

      return res.status(200).json({
        message: "Booking marked as no-show. Advance charged.",
        bookingId: booking._id,
        status: booking.status,
        advanceAmount: chargedAdvance,
      });
    }

    // 5. Completed / Cancelled / Booked
    booking.status = status;

    await booking.save();

    return res.status(200).json({
      message: `Booking marked as ${status}`,
      bookingId: booking._id,
      status: booking.status,
    });
  } catch (error) {
    console.log("Update booking status error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
