import { Router } from 'express';
import {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  recalculateBalance
} from '../controllers/accountController.js';
import {
  listAccountsValidators,
  createAccountValidators,
  updateAccountValidators,
  accountIdValidator
} from '../validators/accountValidators.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { injectOwnerFilter } from '../middlewares/ownerFilterMiddleware.js';

const router = Router();

router.use(authenticate, injectOwnerFilter);

router.get('/', listAccountsValidators, validate, listAccounts);
router.post('/', createAccountValidators, validate, createAccount);
router.get('/:id', accountIdValidator, validate, getAccount);
router.put('/:id', updateAccountValidators, validate, updateAccount);
router.delete('/:id', accountIdValidator, validate, deleteAccount);
router.post('/:id/recalculate', accountIdValidator, validate, recalculateBalance);

export default router;