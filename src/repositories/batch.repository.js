import BaseRepository from './base.repository.js';
import Batch from '../models/Batch.model.js';

class BatchRepository extends BaseRepository {
  constructor() {
    super(Batch);
  }

  async findByCourse(courseId) {
    return this.model.find({ course: courseId }).lean();
  }

  async findActive(filter = {}) {
    return this.model.find({ ...filter, isActive: true }).lean();
  }
}

export default new BatchRepository();
