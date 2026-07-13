import { courseRepository } from '../repositories/index.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/apiError.js';
import logger from '../utils/logger.js';
import Batch from '../models/Batch.model.js';
import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';

const courseService = {
  async getAll({ page = 1, limit = 10, sort = { createdAt: -1 }, search, category, isPublished, isActive }) {
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true' || isPublished === true;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;

    const { docs, total } = await courseRepository.find(filter, {
      page,
      limit,
      sort,
      populate: { path: 'createdBy', select: 'name email' },
    });

    return { courses: docs, total };
  },

  async getAllPublished({ page = 1, limit = 50, category }) {
    const filter = { isPublished: true, isActive: true };
    if (category) filter.category = category;

    const { docs, total } = await courseRepository.find(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    const coursesWithBatches = await Promise.all(
      docs.map(async (course) => {
        const batches = await Batch.find({
          course: course._id,
          isActive: true,
          status: { $in: ['upcoming', 'ongoing'] },
        })
          .select('name maxStudents enrolledStudents status startDate')
          .lean();

        const totalEnrolled = batches.reduce((sum, b) => sum + (b.enrolledStudents?.length || 0), 0);
        const totalCapacity = batches.reduce((sum, b) => sum + (b.maxStudents || 10), 0);
        const hasSpace = batches.some((b) => (b.enrolledStudents?.length || 0) < (b.maxStudents || 10));

        return {
          ...course,
          batchInfo: {
            totalBatches: batches.length,
            totalEnrolled,
            totalCapacity,
            hasSpace,
            batches: batches.map((b) => ({
              _id: b._id,
              name: b.name,
              status: b.status,
              startDate: b.startDate,
              enrolledCount: b.enrolledStudents?.length || 0,
              maxStudents: b.maxStudents,
              hasSpace: (b.enrolledStudents?.length || 0) < (b.maxStudents || 10),
            })),
          },
        };
      })
    );

    return { courses: coursesWithBatches, total };
  },

  async getById(id) {
    const course = await courseRepository.findById(id, {
      path: 'createdBy',
      select: 'name email',
    });

    if (!course) {
      throw new NotFoundError('Course');
    }

    return course;
  },

  async create(data, createdBy) {
    const existing = await courseRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError('A course with this code already exists');
    }

    const course = await courseRepository.create({
      ...data,
      createdBy,
    });

    logger.info(`Course created: ${course.name} (${course.code}) by ${createdBy || 'system'}`);
    return course;
  },

  async update(id, data, updatedBy) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Course');
    }

    if (data.code && data.code !== course.code) {
      const existing = await courseRepository.findByCode(data.code);
      if (existing) {
        throw new ConflictError('A course with this code already exists');
      }
    }

    const updated = await courseRepository.update(id, data);
    logger.info(`Course ${id} updated by ${updatedBy || 'system'}`);
    return updated;
  },

  async delete(id, deletedBy) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Course');
    }

    const batches = await Batch.find({ course: id }).select('_id enrolledStudents').lean();
    const batchIds = batches.map((b) => b._id);
    const allStudentIds = [...new Set(batches.flatMap((b) => (b.enrolledStudents || []).map((s) => s.toString())))];

    if (allStudentIds.length > 0) {
      await User.updateMany(
        { _id: { $in: allStudentIds }, selectedCourse: id },
        { $unset: { selectedCourse: 1, selectedCourseName: 1, paymentId: 1, paymentStatus: 1, paymentPlan: 1 }, $set: { accountStatus: 'pending_payment' } }
      );
    }

    if (batchIds.length > 0) {
      await Payment.deleteMany({ user: { $in: allStudentIds } });
    }

    await Batch.deleteMany({ course: id });
    await courseRepository.model.findByIdAndDelete(id);

    logger.info(`Course ${id} and all related data hard-deleted by ${deletedBy || 'system'}`);
    return true;
  },

  async getStats() {
    const total = await courseRepository.count({});
    const published = await courseRepository.count({ isPublished: true });
    const byCategory = await courseRepository.model.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return { total, published, unpublished: total - published, byCategory };
  },
};

export default courseService;
