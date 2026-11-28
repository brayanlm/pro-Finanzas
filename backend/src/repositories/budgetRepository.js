import { BaseRepository } from './BaseRepository.js';
import Budget from '../models/Budget.js';
import mongoose from 'mongoose';

class BudgetRepository extends BaseRepository {
  constructor() {
    super(Budget);
  }

  async findByUser(userId, year, month) {
    return this.find({ userId, year, month }, { sort: { createdAt: 1 } });
  }

  async findByIdAndUser(id, userId) {
    return this.findOne({ _id: id, userId });
  }

  async findByCategoryAndPeriod(userId, categoryId, year, month) {
    return this.findOne({ userId, categoryId, year, month });
  }

  async upsert(userId, categoryId, year, month, data, session = null) {
    return this.model.findOneAndUpdate(
      { userId, categoryId, year, month },
      {
        ...data,
        userId, categoryId, year, month,
        // Si el presupuesto no existe, se crea sin exceder la validación `amount`.
        $setOnInsert: { amount: 0 }
      },
      { returnDocument: 'after', upsert: true, runValidators: true, session, setDefaultsOnInsert: true }
    ).lean();
  }

  async getWithCategory(userId, year, month) {
    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId), year, month } },
      { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: {
        categoryId: 1,
        year: 1,
        month: 1,
        amount: 1,
        spent: 1,
        alertThresholds: 1,
        percentage: { $cond: [{ $eq: ['$amount', 0] }, 0, { $multiply: [{ $divide: ['$spent', '$amount'] }, 100] }] },
        remaining: { $subtract: ['$amount', '$spent'] },
        'category.name': 1,
        'category.color': 1,
        'category.icon': 1,
        'category.type': 1
      }},
      { $sort: { 'category.name': 1 } }
    ];
    return this.aggregate(pipeline);
  }

  async getSummary(userId, year, month) {
    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId), year, month } },
      { $group: {
        _id: null,
        totalBudgeted: { $sum: '$amount' },
        totalSpent: { $sum: '$spent' },
        byAlertLevel: {
          $push: {
            $cond: [
              { $gte: [{ $cond: [{ $eq: ['$amount', 0] }, 0, { $multiply: [{ $divide: ['$spent', '$amount'] }, 100] }] }, '$alertThresholds.critical'] },
              'critical',
              { $cond: [
                { $gte: [{ $cond: [{ $eq: ['$amount', 0] }, 0, { $multiply: [{ $divide: ['$spent', '$amount'] }, 100] }] }, '$alertThresholds.danger'] },
                'danger',
                { $cond: [
                  { $gte: [{ $cond: [{ $eq: ['$amount', 0] }, 0, { $multiply: [{ $divide: ['$spent', '$amount'] }, 100] }] }, '$alertThresholds.warning'] },
                  'warning',
                  'normal'
                ]}
              ]}
            ]}
        }
      }},
      { $project: {
        _id: 0,
        totalBudgeted: 1,
        totalSpent: 1,
        overallPercentage: { $cond: [{ $eq: ['$totalBudgeted', 0] }, 0, { $multiply: [{ $divide: ['$totalSpent', '$totalBudgeted'] }, 100] }] },
        byAlertLevel: 1
      }}
    ];
    const result = await this.aggregate(pipeline);
    if (!result[0]) return { totalBudgeted: 0, totalSpent: 0, overallPercentage: 0, byAlertLevel: { normal: 0, warning: 0, danger: 0, critical: 0 } };
    const alertCounts = result[0].byAlertLevel.reduce((acc, level) => { acc[level] = (acc[level] || 0) + 1; return acc; }, {});
    return { ...result[0], byAlertLevel: { normal: 0, warning: 0, danger: 0, critical: 0, ...alertCounts } };
  }

  async recalculateSpent(budgetId, session = null) {
    return this.model.recalculateSpent(budgetId, session);
  }
}

export default new BudgetRepository();