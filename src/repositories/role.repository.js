import BaseRepository from './base.repository.js';
import Role from '../models/Role.model.js';

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  async findByName(name) {
    return this.model.findOne({ name: name.toLowerCase() }).lean();
  }

  async findActiveRoles() {
    return this.model.find({ isActive: true }).sort({ level: 1 }).lean();
  }
}

export default new RoleRepository();
