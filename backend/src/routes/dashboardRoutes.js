import { Router } from 'express';
import {
  getDashboardSummary,
  getDashboardCharts
} from '../controllers/dashboardController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { injectOwnerFilter } from '../middlewares/ownerFilterMiddleware.js';

const router = Router();

router.use(authenticate, injectOwnerFilter);

router.get('/summary', getDashboardSummary);
router.get('/charts', getDashboardCharts);

export default router;