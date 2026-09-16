import Staff from '../models/staff.js';
import mongoose from 'mongoose';

// POST /api/staff/create
export const createStaff = async (req, res) => {
  try {
    const { name, phone, esslId, salary } = req.body;
const companyId = req.companyId || req.body.companyId ||"652f1e1a1234567890abcdef";// from auth middleware, not from body

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
    const companyId = req.companyId || req.query.companyId;

    const staff = await Staff.find({ companyId, isActive: true })
      .sort({ name: 1 });

    return res.status(200).json({ staff });
  } catch (err) {
    console.error('listStaff error:', err);
    return res.status(500).json({ error: 'Failed to fetch staff list' });
  }
};

// GET /api/staff/:id
export const getStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId || req.query.companyId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const filter = { _id: id };
    if (companyId) {
      filter.companyId = companyId;
    }

    const staff = await Staff.findOne(filter);

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    return res.status(200).json({ staff });
  } catch (err) {
    console.error('getStaff error:', err);
    return res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

// PUT /api/staff/:id
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId || req.body.companyId;
    const { name, phone, esslId, salary } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (phone) updateFields.phone = phone.trim();
    if (esslId) updateFields.esslId = esslId.trim();
    if (salary !== undefined) {
      if (isNaN(salary) || salary < 0) {
        return res.status(400).json({ error: 'salary must be a valid non-negative number' });
      }
      updateFields.salary = salary;
    }

    const filter = { _id: id };
    if (companyId) {
      filter.companyId = companyId;
    }

    const staff = await Staff.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    return res.status(200).json({ staff });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This eSSL ID is already assigned to another staff member' });
    }
    console.error('updateStaff error:', err);
    return res.status(500).json({ error: 'Failed to update staff' });
  }
};

// DELETE /api/staff/:id
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId || req.query.companyId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const filter = { _id: id };
    if (companyId) {
      filter.companyId = companyId;
    }

    const staff = await Staff.findOneAndUpdate(
      filter,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    return res.status(200).json({ message: 'Staff deactivated successfully' });
  } catch (err) {
    console.error('deleteStaff error:', err);
    return res.status(500).json({ error: 'Failed to delete staff' });
  }
};