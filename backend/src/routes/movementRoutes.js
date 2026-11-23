import { Router } from 'express';
import {
  listMovements,
  getMovement,
  createMovement,
  updateMovement,
  deleteMovement,
  getSummary
} from '../controllers/movementController.js';
import {
  listMovementsValidators,
  createMovementValidators,
  updateMovementValidators,
  movementIdValidator,
  summaryValidators
} from '../validators/movementValidators.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { injectOwnerFilter } from '../middlewares/ownerFilterMiddleware.js';

const router = Router();

router.use(authenticate, injectOwnerFilter);

router.get('/', listMovementsValidators, validate, listMovements);
router.get('/stats/summary', summaryValidators, validate, getSummary);
router.post('/', createMovementValidators, validate, createMovement);
router.get('/:id', movementIdValidator, validate, getMovement);
router.put('/:id', updateMovementValidators, validate, updateMovement);
router.delete('/:id', movementIdValidator, validate, deleteMovement);

export default router;