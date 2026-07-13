class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async find(filter = {}, options = {}) {
    const { sort = { createdAt: -1 }, page, limit, populate = '' } = options;

    let query = this.model.find(filter);

    if (populate) {
      if (Array.isArray(populate)) {
        for (const p of populate) {
          query = query.populate(p);
        }
      } else {
        query = query.populate(populate);
      }
    }

    const total = await this.model.countDocuments(filter);

    query = query.sort(sort);

    if (page && limit) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const docs = await query.lean();

    return { docs, total };
  }

  async findById(id, populate = '') {
    let query = this.model.findById(id);

    if (populate) {
      if (Array.isArray(populate)) {
        for (const p of populate) {
          query = query.populate(p);
        }
      } else {
        query = query.populate(populate);
      }
    }

    return query.lean();
  }

  async findOne(filter, populate = '') {
    let query = this.model.findOne(filter);

    if (populate) {
      if (Array.isArray(populate)) {
        for (const p of populate) {
          query = query.populate(p);
        }
      } else {
        query = query.populate(populate);
      }
    }

    return query.lean();
  }

  async create(data) {
    const doc = new this.model(data);
    await doc.save();
    return doc.toObject();
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async softDelete(id) {
    return this.model.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
  }

  async hardDelete(id) {
    return this.model.findOneAndDelete({ _id: id }).lean();
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async exists(filter) {
    const doc = await this.model.findOne(filter).select('_id').lean();
    return doc !== null;
  }
}

export default BaseRepository;
