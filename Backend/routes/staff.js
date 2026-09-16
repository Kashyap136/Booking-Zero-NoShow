import express from 'express';
// import {authMiddleware} from '../middleware/authMiddleware.js';   
import {
  createStaff,
  listStaff,
  getStaff,
  updateStaff,
  deleteStaff
} from '../controllers/staff.js';

const router = express.Router();

// sab routes pe auth lagega - req.companyId set hoga
// router.use(authMiddleware);        

router.post('/create', createStaff);
router.get('/list', listStaff);
router.get('/:id', getStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

export default router;