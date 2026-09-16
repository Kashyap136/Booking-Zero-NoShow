import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },

        customerName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },

        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            required: true
        },

        bookingDate: {
            type: String,
            required: true
        },

        slot: {
            type: String,
            required: true
        },

        totalAmount: {
            type: Number,
            required: true
        },

        advanceAmount: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "completed",
                "cancelled"
            ],
            default: "pending"
        },
    },
    {
        timestamps: true
    }
);


bookingSchema.index(
    {
        staffId: 1,
        bookingDate: 1,
        slot: 1
    },
    {
        unique: true
    }
);


export default mongoose.model("Booking", bookingSchema);
