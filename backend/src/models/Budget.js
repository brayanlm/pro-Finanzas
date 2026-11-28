import mongoose from 'mongoose';
import { roundMoney } from '../utils/money.js';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2050
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  // `amount` = presupuesto asignado. 0 = sin límite definido. La validación de
  // "montos positivos" para presupuestos explícitos vive en los validators de ruta.
  amount: {
    type: Number,
    default: 0,
    min: [0, 'El presupuesto no puede ser negativo'],
    set: (v) => (v === undefined || v === null ? v : (Number.isFinite(Number(v)) ? roundMoney(v) : v)),
    validate: { validator: Number.isFinite, message: 'Presupuesto debe ser un número válido' }
  },
  spent: {
    type: Number,
    default: 0,
    set: (v) => (v === undefined || v === null ? v : (Number.isFinite(Number(v)) ? roundMoney(v) : v)),
    validate: { validator: Number.isFinite, message: 'Gastado debe ser un número válido' }
  },
  alertThresholds: {
    warning: { type: Number, default: 80 },
    danger: { type: Number, default: 90 },
    critical: { type: Number, default: 100 }
  }
}, {
  timestamps: true,
  versionKey: false
});

budgetSchema.index({ userId: 1, categoryId: 1, year: 1, month: 1 }, { unique: true });
budgetSchema.index({ userId: 1, year: 1, month: 1 });

budgetSchema.virtual('percentage').get(function() {
  if (this.amount === 0) return 0;
  return Math.round((this.spent / this.amount) * 100 * 100) / 100;
});

budgetSchema.virtual('alertLevel').get(function() {
  const pct = this.percentage;
  if (pct >= this.alertThresholds.critical) return 'critical';
  if (pct >= this.alertThresholds.danger) return 'danger';
  if (pct >= this.alertThresholds.warning) return 'warning';
  return 'normal';
});

budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.amount - this.spent);
});

budgetSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

budgetSchema.statics.getOrCreateForMonth = async function(userId, categoryId, year, month) {
  let budget = await this.findOne({ userId, categoryId, year, month });
  if (!budget) {
    budget = await this.create({ userId, categoryId, year, month, amount: 0 });
  }
  return budget;
};

budgetSchema.statics.recalculateSpent = async function(budgetId, session = null) {
  const Movement = mongoose.model('Movement');
  const budget = await this.findById(budgetId).session(session);
  if (!budget) return null;

  const start = new Date(budget.year, budget.month - 1, 1);
  const end = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);

  const result = await Movement.aggregate([
    { $match: { userId: budget.userId, categoryId: budget.categoryId, type: 'expense', date: { $gte: start, $lte: end }, deletedAt: null } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]).session(session);

  budget.spent = roundMoney(result[0]?.total || 0);
  await budget.save({ session });
  return budget;
};

budgetSchema.methods.incrementSpent = async function(amount, session = null) {
  this.spent = roundMoney((this.spent || 0) + Number(amount || 0));
  await this.save({ session });
  return this;
};

budgetSchema.methods.decrementSpent = async function(amount, session = null) {
  this.spent = Math.max(0, roundMoney((this.spent || 0) - Number(amount || 0)));
  await this.save({ session });
  return this;
};

export default mongoose.model('Budget', budgetSchema);