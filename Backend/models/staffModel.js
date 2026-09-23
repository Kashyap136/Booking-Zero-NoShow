import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  esslId: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// same eSSL machine ki ID do companies me clash na kare isliye
// companyId + esslId ka combo unique rakha hai (globally unique nahi)

staffSchema.index({ companyId: 1, esslId: 1 }, { unique: true });

export default mongoose.model('Staff', staffSchema);