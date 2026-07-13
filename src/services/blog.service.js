import slugify from 'slugify';
import blogRepository from '../repositories/blog.repository.js';
import { NotFoundError, ValidationError } from '../utils/apiError.js';

const generateSlug = async (title) => {
  let base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let counter = 1;
  while (await blogRepository.exists({ slug })) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
};

const calculateReadTime = (content) => {
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const blogService = {
  async createBlog(data) {
    const slug = await generateSlug(data.title);
    const readTime = calculateReadTime(data.content || '');

    const blog = await blogRepository.create({
      ...data,
      slug,
      readTime,
      publishedAt: data.isPublished ? new Date() : null,
    });

    return blog;
  },

  async updateBlog(id, data) {
    const existing = await blogRepository.findById(id);
    if (!existing) throw new NotFoundError('Blog');

    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = await generateSlug(data.title);
    }

    const readTime = data.content
      ? calculateReadTime(data.content)
      : existing.readTime;

    const updateData = {
      ...data,
      slug,
      readTime,
    };

    if (data.isPublished && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const blog = await blogRepository.update(id, updateData);
    return blog;
  },

  async deleteBlog(id) {
    const blog = await blogRepository.findById(id);
    if (!blog) throw new NotFoundError('Blog');
    await blogRepository.hardDelete(id);
    return true;
  },

  async getAllPublished({ page = 1, limit = 12, category, search, tag } = {}) {
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    return blogRepository.find(filter, {
      page,
      limit,
      sort: { publishedAt: -1 },
      populate: { path: 'author', select: 'name avatar' },
    });
  },

  async getBySlug(slug) {
    const blog = await blogRepository.findBySlug(slug);
    if (!blog || !blog.isPublished) throw new NotFoundError('Blog');
    return blog;
  },

  async getAllForAdmin({ page = 1, limit = 20, status, category, search } = {}) {
    const filter = {};
    if (status === 'published') filter.isPublished = true;
    else if (status === 'draft') filter.isPublished = false;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    return blogRepository.find(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'author', select: 'name' },
    });
  },

  async incrementViews(slug) {
    return blogRepository.incrementViews(slug);
  },

  async getSitemapData() {
    return blogRepository.getSitemapData();
  },
};

export default blogService;
