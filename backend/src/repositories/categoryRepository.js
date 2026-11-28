import mongoose from 'mongoose';
import { BaseRepository } from './BaseRepository.js';
import Category from '../models/Category.js';

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async findByUser(userId, filters = {}) {
    const query = { userId, deletedAt: null, ...filters };
    return this.find(query, { sort: { type: 1, sortOrder: 1, name: 1 } });
  }

  async findByIdAndUser(id, userId) {
    return this.findOne({ _id: id, userId, deletedAt: null });
  }

  async findActiveByUser(userId, type = null) {
    const query = { userId, isActive: true, deletedAt: null };
    if (type) query.type = type;
    return this.find(query, { sort: { sortOrder: 1, name: 1 } });
  }

  async existsByName(userId, name, excludeId = null) {
    const query = { userId, name: name.trim(), isActive: true, deletedAt: null };
    if (excludeId) query._id = { $ne: excludeId };
    const count = await this.count(query);
    return count > 0;
  }

  async seedDefaults(userId) {
    const defaults = Category.getDefaultCategories();
    const docs = defaults.map(c => ({ ...c, userId, isDefault: true }));
    return this.createMany(docs);
  }

  async getWithMovementCount(userId, type = null) {
    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId), deletedAt: null, ...(type && { type }) } },
      { $lookup: { from: 'movements', localField: '_id', foreignField: 'categoryId', as: 'movements' } },
      { $addFields: { movementCount: { $size: '$movements' } } },
      { $project: { movements: 0 } },
      { $sort: { type: 1, sortOrder: 1, name: 1 } }
    ];
    return this.aggregate(pipeline);
  }
}

export default new CategoryRepository();