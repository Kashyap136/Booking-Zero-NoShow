import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        durationMins: {
            type: Number,
            required: true
        },

        price: {
            type: Number,
            required: true
        },

        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff"
        },

        category: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Service", serviceSchema);