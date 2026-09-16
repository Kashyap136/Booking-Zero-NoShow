import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    subdomain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    ownerEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    upiId: {
      type: String,
      default: null,
    },
    latitude: {
      type: Number,
    },

    longitude: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

const Company = mongoose.model("Company", companySchema);

export default Company;
