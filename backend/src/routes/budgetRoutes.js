import { Router } from 'express';
import {
  listBudgets,
  getBudget,
  upsertBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary
} from '../controllers/budgetController.js';
import {
  listBudgetsValidators,
  createBudgetValidators,
  updateBudgetValidators,
  budgetIdValidator
} from '../validators/budgetValidators.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { injectOwnerFilter } from '../middlewares/ownerFilterMiddleware.js';

const router = Router();

router.use(authenticate, injectOwnerFilter);

router.get('/', listBudgetsValidators, validate, listBudgets);
router.get('/stats/summary', listBudgetsValidators, validate, getBudgetSummary);
router.post('/', createBudgetValidators, validate, upsertBudget);
router.get('/:id', budgetIdValidator, validate, getBudget);
router.put('/:id', updateBudgetValidators, validate, updateBudget);
router.delete('/:id', budgetIdValidator, validate, deleteBudget);

export default router;