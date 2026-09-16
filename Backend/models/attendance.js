import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  inTime: {
    type: String,
    default: null
  },
  outTime: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  }
}, { timestamps: true });

// ek staff ki ek date pe sirf ek hi attendance entry ho sakti hai

attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
