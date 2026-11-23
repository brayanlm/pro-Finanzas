import { Router } from 'express';
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaults
} from '../controllers/categoryController.js';
import {
  listCategoriesValidators,
  createCategoryValidators,
  updateCategoryValidators,
  categoryIdValidator
} from '../validators/categoryValidators.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { injectOwnerFilter } from '../middlewares/ownerFilterMiddleware.js';

const router = Router();

router.use(authenticate, injectOwnerFilter);

router.get('/', listCategoriesValidators, validate, listCategories);
router.post('/', createCategoryValidators, validate, createCategory);
router.post('/seed-defaults', seedDefaults);
router.get('/:id', categoryIdValidator, validate, getCategory);
router.put('/:id', updateCategoryValidators, validate, updateCategory);
router.delete('/:id', categoryIdValidator, validate, deleteCategory);

export default router;