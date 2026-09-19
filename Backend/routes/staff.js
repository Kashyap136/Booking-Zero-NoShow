import express from 'express';
import {authMiddleware} from '../middleware/authMiddleware.js';   
import {
  createStaff,
  listStaff,
  getStaff,
  updateStaff,
  deleteStaff
} from '../controllers/staffController.js';

const router = express.Router();

// sab routes pe auth lagega - req.companyId set hoga
router.use(authMiddleware);        

router.post('/create', createStaff);
router.get('/list', listStaff);
router.get('/:id', getStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

// Frontend POST-based update/delete (body me staffId bhejta hai)
router.post('/update', (req, res, next) => {
  req.params.id = req.body.staffId;
  next();
}, updateStaff);

router.post('/delete', (req, res, next) => {
  req.params.id = req.body.staffId;
  next();
}, deleteStaff);

export default router;