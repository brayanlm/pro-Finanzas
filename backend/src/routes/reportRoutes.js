import { Router } from 'express';
import {
  exportReport,
  getReportPreview
} from '../controllers/reportController.js';
import {
  exportReportValidators
} from '../validators/reportValidators.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { injectOwnerFilter } from '../middlewares/ownerFilterMiddleware.js';

const router = Router();

router.use(authenticate, injectOwnerFilter);

router.get('/export', exportReportValidators, validate, exportReport);
router.get('/movements', getReportPreview);

export default router;