import express from 'express';
import {authMiddleware} from '../middleware/authMiddleware.js';   
import {
  createStaff,
  listStaff,
} from '../controllers/staff.js';

const router = express.Router();

// sab routes pe auth lagega - req.companyId set hoga
router.use(authMiddleware);        

router.post('/create', createStaff);
router.get('/list', listStaff);

export default router;