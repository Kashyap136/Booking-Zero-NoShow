import mongoose from "mongoose";

const companySchema = new mongoose.Schema(

  {
    
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    Password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


export default mongoose.model("Company", companySchema);