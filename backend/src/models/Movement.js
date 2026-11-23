import mongoose from 'mongoose';

const movementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'El importe debe ser mayor a 0'],
    validate: {
      validator: Number.isFinite,
      message: 'El importe debe ser un número válido'
    }
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringConfig: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    endDate: Date,
    nextDate: Date
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

movementSchema.index({ userId: 1, date: -1 });
movementSchema.index({ userId: 1, type: 1, date: -1 });
movementSchema.index({ userId: 1, categoryId: 1, date: -1 });
movementSchema.index({ userId: 1, accountId: 1, date: -1 });
movementSchema.index({ userId: 1, deletedAt: 1, date: -1 });
movementSchema.index({ userId: 1, type: 1, categoryId: 1, date: -1 });

movementSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

movementSchema.virtual('account', {
  ref: 'Account',
  localField: 'accountId',
  foreignField: '_id',
  justOne: true
});

movementSchema.query.active = function() {
  return this.where({ deletedAt: null });
};

movementSchema.statics.getMonthlySummary = async function(userId, year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end }, deletedAt: null } },
    { $group: {
      _id: '$type',
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }},
    { $project: { type: '$_id', total: 1, count: 1, _id: 0 } }
  ]);
};

movementSchema.statics.getMonthlyEvolution = async function(userId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startDate }, deletedAt: null } },
    { $group: {
      _id: {
        year: { $year: '$date' },
        month: { $month: '$date' },
        type: '$type'
      },
      total: { $sum: '$amount' }
    }},
    { $group: {
      _id: { year: '$_id.year', month: '$_id.month' },
      income: { $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] } },
      expense: { $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] } }
    }},
    { $project: {
      _id: 0,
      year: '$_id.year',
      month: '$_id.month',
      income: { $ifNull: ['$income', 0] },
      expense: { $ifNull: ['$expense', 0] },
      balance: { $subtract: [{ $ifNull: ['$income', 0] }, { $ifNull: ['$expense', 0] }] }
    }},
    { $sort: { year: 1, month: 1 } }
  ]);
};

movementSchema.statics.getCategoryDistribution = async function(userId, type, startDate, endDate) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), type, date: { $gte: startDate, $lte: endDate }, deletedAt: null } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, categoryId: '$_id', name: '$category.name', color: '$category.color', icon: '$category.icon', total: 1, count: 1 } },
    { $sort: { total: -1 } }
  ]);
};

export default mongoose.model('Movement', movementSchema);