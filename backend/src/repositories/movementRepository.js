import { BaseRepository } from './BaseRepository.js';
import Movement from '../models/Movement.js';

class MovementRepository extends BaseRepository {
  constructor() {
    super(Movement);
  }

  async findByUser(userId, filters = {}) {
    const query = { userId, deletedAt: null, ...filters };
    return this.find(query, { sort: { date: -1, createdAt: -1 } });
  }

  async findByIdAndUser(id, userId) {
    return this.findOne({ _id: id, userId, deletedAt: null });
  }

  async findByIdAndUserWithPopulate(id, userId) {
    return this.model.findOne({ _id: id, userId, deletedAt: null })
      .populate('category', 'name type color icon')
      .populate('account', 'name type')
      .lean();
  }

  async findForExport(userId, filters = {}) {
    const query = { userId, deletedAt: null, ...filters };
    return this.model.find(query)
      .populate('category', 'name type color icon')
      .populate('account', 'name type')
      .sort({ date: -1 })
      .lean();
  }

  async getMonthlySummary(userId, year, month) {
    return this.model.getMonthlySummary(userId, year, month);
  }

  async getMonthlyEvolution(userId, months = 12) {
    return this.model.getMonthlyEvolution(userId, months);
  }

  async getCategoryDistribution(userId, type, startDate, endDate) {
    return this.model.getCategoryDistribution(userId, type, startDate, endDate);
  }

  async getRecent(userId, limit = 10) {
    return this.find({ userId }, { sort: { date: -1, createdAt: -1 }, limit });
  }

  async getTotalByType(userId, type, startDate, endDate) {
    const result = await this.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), type, date: { $gte: startDate, $lte: endDate }, deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    return result[0] || { total: 0, count: 0 };
  }
}

export default new MovementRepository();