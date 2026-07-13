import { batchRepository, courseRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../utils/apiError.js';
import logger from '../utils/logger.js';
import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';

const batchService = {
  async getAll({ page = 1, limit = 10, sort = { createdAt: -1 }, search, course, status, isActive }) {
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    if (course) filter.course = course;
    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;

    const { docs, total } = await batchRepository.find(filter, {
      page,
      limit,
      sort,
      populate: [
        { path: 'course', select: 'name code category' },
        { path: 'faculty', select: 'name email' },
        { path: 'coordinator', select: 'name email' },
      ],
    });

    return { batches: docs, total };
  },

  async getById(id) {
    const batch = await batchRepository.findById(id);
    if (!batch) {
      throw new NotFoundError('Batch');
    }

    const populated = await batchRepository.model.findById(id)
      .populate('course', 'name code category fee duration')
      .populate('faculty', 'name email')
      .populate('coordinator', 'name email')
      .populate('enrolledStudents', 'name email phone')
      .lean();

    return populated;
  },

  async create(data, createdBy) {
    if (data.course) {
      const course = await courseRepository.findById(data.course);
      if (!course) {
        throw new NotFoundError('Course');
      }
    }

    const batch = await batchRepository.create({
      ...data,
      createdBy,
    });

    logger.info(`Batch created: ${batch.name} by ${createdBy || 'system'}`);
    return batch;
  },

  async update(id, data, updatedBy) {
    const batch = await batchRepository.findById(id);
    if (!batch) {
      throw new NotFoundError('Batch');
    }

    if (data.course) {
      const course = await courseRepository.findById(data.course);
      if (!course) {
        throw new NotFoundError('Course');
      }
    }

    const updated = await batchRepository.update(id, data);
    logger.info(`Batch ${id} updated by ${updatedBy || 'system'}`);
    return updated;
  },

  async delete(id, deletedBy) {
    const batch = await batchRepository.findById(id);
    if (!batch) {
      throw new NotFoundError('Batch');
    }

    const studentIds = (batch.enrolledStudents || []).map((s) => s.toString());

    if (studentIds.length > 0) {
      await Payment.deleteMany({ user: { $in: studentIds } });

      await User.updateMany(
        { _id: { $in: studentIds } },
        { $unset: { paymentId: 1 }, $set: { paymentStatus: 'pending', accountStatus: 'pending_payment' } }
      );
    }

    await batchRepository.model.findByIdAndDelete(id);

    logger.info(`Batch ${id} and all related data hard-deleted by ${deletedBy || 'system'}`);
    return true;
  },

  async enrollStudent(batchId, studentId) {
    const batch = await batchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch');
    }

    if (batch.enrolledStudents.includes(studentId)) {
      throw new ValidationError('Student is already enrolled in this batch');
    }

    if (batch.maxStudents && batch.enrolledStudents.length >= batch.maxStudents) {
      throw new ValidationError('Batch is full');
    }

    await batchRepository.model.findByIdAndUpdate(batchId, {
      $addToSet: { enrolledStudents: studentId },
    });

    logger.info(`Student ${studentId} enrolled in batch ${batchId}`);
    return true;
  },

  async removeStudent(batchId, studentId) {
    const batch = await batchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch');
    }

    await batchRepository.model.findByIdAndUpdate(batchId, {
      $pull: { enrolledStudents: studentId },
    });

    logger.info(`Student ${studentId} removed from batch ${batchId}`);
    return true;
  },

  async getStats() {
    const total = await batchRepository.count({});
    const byStatus = await batchRepository.model.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return { total, byStatus };
  },

  async getEnrolledStudents(batchId) {
    const batch = await batchRepository.model.findById(batchId)
      .populate('enrolledStudents', 'name email phone avatar accountStatus selectedCourseName paymentStatus paymentPlan')
      .populate('course', 'name code category')
      .lean();

    if (!batch) {
      throw new NotFoundError('Batch');
    }

    const studentIds = batch.enrolledStudents.map((s) => s._id);
    const payments = await Payment.find({
      user: { $in: studentIds },
    })
      .select('user status amount paymentPlan transactionId createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const paymentMap = {};
    payments.forEach((p) => {
      if (!paymentMap[p.user?.toString()]) {
        paymentMap[p.user?.toString()] = p;
      }
    });

    const studentsWithPayment = batch.enrolledStudents.map((student) => ({
      ...student,
      latestPayment: paymentMap[student._id?.toString()] || null,
    }));

    return {
      batch: { _id: batch._id, name: batch.name, course: batch.course, maxStudents: batch.maxStudents },
      students: studentsWithPayment,
      enrolledCount: studentsWithPayment.length,
    };
  },

  async getMyBatches(studentId) {
    const batches = await batchRepository.model.find({
      enrolledStudents: studentId,
      isActive: true,
    })
      .populate('course', 'name code category description shortDescription fee duration level syllabus thumbnail')
      .populate('faculty', 'name email avatar')
      .populate('coordinator', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return batches;
  },

  async autoAssignBatch(courseId, studentId) {
    const Batch = batchRepository.model;

    let batch = await Batch.findOne({
      course: courseId,
      isActive: true,
      status: { $in: ['upcoming', 'ongoing'] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!batch) {
      const courseDoc = await courseRepository.findById(courseId);
      const courseName = courseDoc ? courseDoc.name : 'Course';
      const batchCount = await Batch.countDocuments({ course: courseId });

      batch = await batchRepository.create({
        name: `${courseName} - Batch ${batchCount + 1}`,
        course: courseId,
        startDate: new Date(),
        maxStudents: 10,
        status: 'upcoming',
      });
      batch = batch.toObject();
    }

    const currentCount = batch.enrolledStudents?.length || 0;
    if (currentCount >= batch.maxStudents) {
      const newBatch = await batchRepository.create({
        name: `${batch.name.replace(/Batch \d+/, '').trim()} Batch ${Math.floor(currentCount / batch.maxStudents) + 2}`,
        course: courseId,
        startDate: new Date(),
        maxStudents: 10,
        status: 'upcoming',
      });

      await Batch.findByIdAndUpdate(newBatch._id, {
        $addToSet: { enrolledStudents: studentId },
      });

      return { batchId: newBatch._id, batchName: newBatch.name, isNewBatch: true };
    }

    await Batch.findByIdAndUpdate(batch._id, {
      $addToSet: { enrolledStudents: studentId },
    });

    return { batchId: batch._id, batchName: batch.name, isNewBatch: false };
  },

  async getCourseBatchesPublic(courseId) {
    const batches = await batchRepository.model.find({
      course: courseId,
      isActive: true,
      status: { $in: ['upcoming', 'ongoing'] },
    })
      .select('name maxStudents enrolledStudents status startDate')
      .sort({ createdAt: -1 })
      .lean();

    return batches.map((b) => ({
      _id: b._id,
      name: b.name,
      status: b.status,
      startDate: b.startDate,
      enrolledCount: b.enrolledStudents?.length || 0,
      maxStudents: b.maxStudents,
      hasSpace: (b.enrolledStudents?.length || 0) < b.maxStudents,
    }));
  },
};

export default batchService;
