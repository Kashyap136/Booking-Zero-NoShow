import Booking from "../Models/BookingModel.js";
import Service from "../Models/ServiceModel.js";
import Staff from "../Models/staffModel.js";

export const createBooking = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { customerName, phone, serviceId, bookingDate, slot } = req.body;

    const service = await Service.findOne({
      _id: serviceId,
      companyId,
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const staffId = service.staffId;

    if (!staffId) {
      return res.status(400).json({
        message: "No staff assigned to this service",
      });
    }

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
    const totalAmount = service.price;

    const advanceAmount = totalAmount * 0.2;

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
    return res.status(200).json({ date, count: bookings.length, bookings });
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
    const allowedStatuses = ["completed", "no-show", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be completed, no-show or cancelled" });
    }
    const booking = await Booking.findOne({ _id: bookingId, companyId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (status === "no-show") {
      booking.status = "no-show";
      booking.advanceAmount = booking.advanceAmount;
      await booking.save();
      return res
        .status(200)
        .json({
          message: "Booking marked as no-show. Advance charged.",
          booking,
        });
    }
    booking.status = status;
    await booking.save();
    return res
      .status(200)
      .json({ message: `Booking marked as ${status}`, booking });
  } catch (error) {
    console.log("Update booking status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
