import { Router } from 'express';
import {
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
  getSystemStats
} from '../controllers/adminController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deactivateUser);
router.get('/stats', getSystemStats);

export default router;