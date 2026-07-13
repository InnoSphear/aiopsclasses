import BaseRepository from './base.repository.js';
import User from '../models/User.model.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, selectFields = '') {
    let query = this.model.findOne({ email: email.toLowerCase().trim(), isDeleted: false });
    if (selectFields) {
      query = query.select(selectFields);
    }
    return query;
  }

  async findActiveUsers(populate = '') {
    let query = this.model.find({ isActive: true, isDeleted: false });
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

  async findByRole(roleId, populate = '') {
    let query = this.model.find({ role: roleId, isDeleted: false });
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
}

export default new UserRepository();
