import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    bookingDate: {
      type: String,
      required: true,
      trim: true,
    },

    slot: {
      type: String,
      required: true,
      trim: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    advanceAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "booked", "completed", "cancelled", "no-show"],
      default: "booked",
    },
  },
  {
    timestamps: true,
  },
);

// One staff cannot have the same slot
// for the same company, date and time.
bookingSchema.index(
  {
    companyId: 1,
    staffId: 1,
    bookingDate: 1,
    slot: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("Booking", bookingSchema);
