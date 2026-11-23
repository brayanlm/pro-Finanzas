export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    return this.model.findById(id, null, options).lean();
  }

  async findOne(filter, options = {}) {
    return this.model.findOne(filter, null, options).lean();
  }

  async find(filter = {}, options = {}) {
    const { sort, limit, skip, select, populate } = options;
    let query = this.model.find(filter).lean();
    if (sort) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    return query;
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async create(data, session = null) {
    const doc = new this.model(data);
    return doc.save({ session });
  }

  async createMany(docs, session = null) {
    return this.model.insertMany(docs, { session, ordered: false });
  }

  async updateById(id, data, options = {}) {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true, ...options }).lean();
  }

  async updateOne(filter, data, options = {}) {
    return this.model.findOneAndUpdate(filter, data, { new: true, runValidators: true, ...options }).lean();
  }

  async deleteById(id, options = {}) {
    return this.model.findByIdAndDelete(id, options).lean();
  }

  async deleteOne(filter, options = {}) {
    return this.model.findOneAndDelete(filter, options).lean();
  }

  async softDeleteById(id, session = null) {
    return this.model.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true, session }).lean();
  }

  async paginate(filter = {}, page = 1, limit = 20, options = {}) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.find(filter, { ...options, skip, limit }),
      this.count(filter)
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  async aggregate(pipeline, options = {}) {
    return this.model.aggregate(pipeline, options);
  }
}