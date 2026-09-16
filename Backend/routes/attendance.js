import express from 'express';
import {authMiddleware} from '../middleware/authMiddleware.js';
import {
  syncAttendance,
  listAttendance,
  getAttendance,
  updateAttendance
} from '../controllers/attendanceController.js';

const router = express.Router();

// IMPORTANT: /sync route auth ke bina rakha hai — eSSL machine JWT nahi bhejegi
// Isko alag se secure karna hoga (API key ya IP whitelist) - neeche note dekho

router.post('/sync', syncAttendance);

// baaki sab routes auth ke peeche
router.use(authMiddleware);
router.get('/list', listAttendance);
router.get('/:id', getAttendance);
router.put('/:id', updateAttendance);

export default router;