import { BaseRepository } from './BaseRepository.js';
import Account from '../models/Account.js';

class AccountRepository extends BaseRepository {
  constructor() {
    super(Account);
  }

  async findByUser(userId, filters = {}) {
    const query = { userId, deletedAt: null, ...filters };
    return this.find(query, { sort: { type: 1, name: 1 } });
  }

  async findByIdAndUser(id, userId) {
    return this.findOne({ _id: id, userId, deletedAt: null });
  }

  async findActiveByUser(userId) {
    return this.find({ userId, isActive: true, deletedAt: null }, { sort: { type: 1, name: 1 } });
  }

  async existsByName(userId, name, excludeId = null) {
    const query = { userId, name: name.trim(), isActive: true, deletedAt: null };
    if (excludeId) query._id = { $ne: excludeId };
    const count = await this.count(query);
    return count > 0;
  }

  async getWithBalance(userId) {
    const pipeline = [
      { $match: { userId: new Account.Types.ObjectId(userId), deletedAt: null } },
      { $lookup: { from: 'movements', localField: '_id', foreignField: 'accountId', as: 'movements' } },
      { $addFields: {
        calculatedBalance: {
          $add: ['$initialBalance', {
            $subtract: [
              { $sum: { $map: { input: { $filter: { input: '$movements', cond: { $eq: ['$$this.type', 'income'] } } }, in: '$$this.amount' } } },
              { $sum: { $map: { input: { $filter: { input: '$movements', cond: { $eq: ['$$this.type', 'expense'] } } }, in: '$$this.amount' } } }
            ]
          }]
        }
      }},
      { $project: { movements: 0 } },
      { $sort: { type: 1, name: 1 } }
    ];
    return this.aggregate(pipeline);
  }
}

export default new AccountRepository();