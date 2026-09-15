import Attendance from '../models/attendance.js';
import Staff from '../models/staff.js';

// POST /api/attendance/sync
// Called by eSSL biometric machine's software/webhook, not by frontend directly
export const syncAttendance = async (req, res) => {
  try {
    const { esslId, inTime, outTime, date } = req.body;

    if (!esslId || !date) {
      return res.status(400).json({ error: 'esslId and date are required' });
    }

    const staff = await Staff.findOne({ esslId: esslId.trim(), isActive: true });

    if (!staff) {
      return res.status(404).json({ error: 'No staff found for this esslId' });
    }

    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // status decide karte hain based on inTime availability
    const status = inTime ? 'present' : 'absent';

    // upsert - agar us staff ki us date ki entry already hai to update karo,
    // warna nayi banao (duplicate sync calls se error nahi aayega)
    const attendance = await Attendance.findOneAndUpdate(
      { staffId: staff._id, date: attendanceDate },
      {
        $set: {
          companyId: staff.companyId,
          inTime: inTime || null,
          outTime: outTime || null,
          status
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({ attendance });
  } catch (err) {
    console.error('syncAttendance error:', err);
    return res.status(500).json({ error: 'Failed to sync attendance' });
  }
};

// GET /api/attendance/list?month=2026-05
export const listAttendance = async (req, res) => {
  try {
    const companyId = req.companyId; // from JWT
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month is required in YYYY-MM format' });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 1); // next month ka 1st, exclusive upper bound

    const attendance = await Attendance.find({
      companyId,
      date: { $gte: startDate, $lt: endDate }
    })
      .populate('staffId', 'name phone esslId')
      .sort({ date: 1 });

    return res.status(200).json({ attendance });
  } catch (err) {
    console.error('listAttendance error:', err);
    return res.status(500).json({ error: 'Failed to fetch attendance list' });
  }
};

// GET /api/attendance/:id  (optional - single record detail ke liye)
export const getAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;

    const attendance = await Attendance.findOne({ _id: id, companyId })
      .populate('staffId', 'name phone esslId');

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    return res.status(200).json({ attendance });
  } catch (err) {
    console.error('getAttendance error:', err);
    return res.status(500).json({ error: 'Failed to fetch attendance record' });
  }
};

// PUT /api/attendance/:id  (manual correction ke liye - reception galat mark kar de to)
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;
    const { inTime, outTime, status } = req.body;

    const updateFields = {};
    if (inTime !== undefined) updateFields.inTime = inTime;
    if (outTime !== undefined) updateFields.outTime = outTime;
    if (status) {
      if (!['present', 'absent'].includes(status)) {
        return res.status(400).json({ error: 'status must be present or absent' });
      }
      updateFields.status = status;
    }

    const attendance = await Attendance.findOneAndUpdate(
      { _id: id, companyId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    return res.status(200).json({ attendance });
  } catch (err) {
    console.error('updateAttendance error:', err);
    return res.status(500).json({ error: 'Failed to update attendance record' });
  }
};