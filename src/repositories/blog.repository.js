import BaseRepository from './base.repository.js';
import Blog from '../models/Blog.model.js';

class BlogRepository extends BaseRepository {
  constructor() {
    super(Blog);
  }

  async findBySlug(slug) {
    return this.model.findOne({ slug }).populate('author', 'name avatar');
  }

  async findPublished(filter = {}, options = {}) {
    return this.find({ ...filter, isPublished: true }, options);
  }

  async findByCategory(category, options = {}) {
    return this.find({ category, isPublished: true }, options);
  }

  async incrementViews(slug) {
    return this.model.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
  }

  async getSitemapData() {
    return this.model
      .find({ isPublished: true })
      .select('slug publishedAt updatedAt')
      .sort({ publishedAt: -1 })
      .lean();
  }
}

export default new BlogRepository();
