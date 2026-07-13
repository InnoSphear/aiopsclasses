import BaseRepository from './base.repository.js';
import Course from '../models/Course.model.js';

class CourseRepository extends BaseRepository {
  constructor() {
    super(Course);
  }

  async findByCode(code) {
    return this.model.findOne({ code: code.toUpperCase() });
  }

  async findPublished(filter = {}) {
    return this.model.find({ ...filter, isPublished: true, isActive: true }).lean();
  }
}

export default new CourseRepository();
