import { categoryRepository } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';

export const listCategories = async (req, res, next) => {
  try {
    const { type, active } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (active !== undefined) filters.isActive = active === 'true';

    const categories = await categoryRepository.findByUser(req.user.id, filters);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const category = await categoryRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!category) {
      throw AppError.notFound('Categoría no encontrada');
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, type, color, icon } = req.body;

    const exists = await categoryRepository.existsByName(req.user.id, name);
    if (exists) {
      throw AppError.conflict('Ya existe una categoría con ese nombre', { field: 'name' });
    }

    const category = await categoryRepository.create({
      userId: req.user.id,
      name,
      type,
      color,
      icon,
      isDefault: false
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, color, icon, isActive, sortOrder } = req.body;

    const category = await categoryRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!category) {
      throw AppError.notFound('Categoría no encontrada');
    }

    if (name && name !== category.name) {
      const exists = await categoryRepository.existsByName(req.user.id, name, req.params.id);
      if (exists) {
        throw AppError.conflict('Ya existe una categoría con ese nombre', { field: 'name' });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (color) updates.color = color;
    if (icon) updates.icon = icon;
    if (isActive !== undefined) updates.isActive = isActive;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;

    const updated = await categoryRepository.updateById(req.params.id, updates);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await categoryRepository.findByIdAndUser(req.params.id, req.user.id);
    if (!category) {
      throw AppError.notFound('Categoría no encontrada');
    }

    if (category.isDefault) {
      throw AppError.unprocessable('No se puede eliminar una categoría por defecto');
    }

    await categoryRepository.softDeleteById(req.params.id);
    res.json({ success: true, message: 'Categoría eliminada correctamente' });
  } catch (error) {
    if (error.message === 'CATEGORY_HAS_MOVEMENTS') {
      return next(AppError.conflict('No se puede eliminar: tiene movimientos asociados', error.details));
    }
    next(error);
  }
};

export const seedDefaults = async (req, res, next) => {
  try {
    await categoryRepository.seedDefaults(req.user.id);
    res.status(201).json({ success: true, data: { created: 12 }, message: 'Categorías por defecto creadas' });
  } catch (error) {
    next(error);
  }
};