import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
    index: true
  },
  color: {
    type: String,
    required: true,
    match: /^#[0-9A-Fa-f]{6}$/
  },
  icon: {
    type: String,
    required: true,
    maxlength: 50
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

categorySchema.index({ userId: 1, type: 1, isActive: 1 });
categorySchema.index({ userId: 1, name: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

categorySchema.virtual('movementCount', {
  ref: 'Movement',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

categorySchema.statics.getDefaultCategories = function() {
  return [
    { name: 'Salario', type: 'income', color: '#10B981', icon: 'briefcase', isDefault: true, sortOrder: 1 },
    { name: 'Freelance', type: 'income', color: '#059669', icon: 'laptop', isDefault: true, sortOrder: 2 },
    { name: 'Inversiones', type: 'income', color: '#047857', icon: 'trending-up', isDefault: true, sortOrder: 3 },
    { name: 'Otros ingresos', type: 'income', color: '#065F46', icon: 'plus-circle', isDefault: true, sortOrder: 4 },
    { name: 'Alimentación', type: 'expense', color: '#EF4444', icon: 'utensils', isDefault: true, sortOrder: 10 },
    { name: 'Transporte', type: 'expense', color: '#DC2626', icon: 'car', isDefault: true, sortOrder: 11 },
    { name: 'Vivienda', type: 'expense', color: '#B91C1C', icon: 'home', isDefault: true, sortOrder: 12 },
    { name: 'Servicios', type: 'expense', color: '#991B1B', icon: 'zap', isDefault: true, sortOrder: 13 },
    { name: 'Ocio', type: 'expense', color: '#F97316', icon: 'gamepad-2', isDefault: true, sortOrder: 14 },
    { name: 'Salud', type: 'expense', color: '#EC4899', icon: 'heart-pulse', isDefault: true, sortOrder: 15 },
    { name: 'Educación', type: 'expense', color: '#8B5CF6', icon: 'graduation-cap', isDefault: true, sortOrder: 16 },
    { name: 'Otros gastos', type: 'expense', color: '#6B7280', icon: 'more-horizontal', isDefault: true, sortOrder: 17 }
  ];
};

categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const Movement = mongoose.model('Movement');
  const count = await Movement.countDocuments({ categoryId: this._id, deletedAt: null });
  if (count > 0) {
    const err = new Error('CATEGORY_HAS_MOVEMENTS');
    err.details = { movementCount: count };
    return next(err);
  }
  next();
});

export default mongoose.model('Category', categorySchema);