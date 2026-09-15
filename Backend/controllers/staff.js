import Staff from '../models/staff.js';
import mongoose from 'mongoose';

// POST /api/staff/create
export const createStaff = async (req, res) => {
  try {
    const { name, phone, esslId, salary } = req.body;
  const companyId = req.companyId || "64f1a2b3c4d5e6f7a8b9c0d1"; // koi bhi 24-character fake ObjectId // from auth middleware, not from body

    if (!name || !phone || !esslId || salary === undefined) {
      return res.status(400).json({ error: 'name, phone, esslId, salary are required' });
    }

    if (isNaN(salary) || salary < 0) {
      return res.status(400).json({ error: 'salary must be a valid non-negative number' });
    }

    const staff = await Staff.create({
      companyId,
      name: name.trim(),
      phone: phone.trim(),
      esslId: esslId.trim(),
      salary
    });

    return res.status(201).json({ staff });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This eSSL ID is already assigned to another staff member' });
    }
    console.error('createStaff error:', err);
    return res.status(500).json({ error: 'Failed to create staff' });
  }
};

// GET /api/staff/list
export const listStaff = async (req, res) => {
  try {
    const companyId = req.companyId; // from JWT, not query param

    const staff = await Staff.find({ companyId, isActive: true })
      .sort({ name: 1 });

    return res.status(200).json({ staff });
  } catch (err) {
    console.error('listStaff error:', err);
    return res.status(500).json({ error: 'Failed to fetch staff list' });
  }
};
