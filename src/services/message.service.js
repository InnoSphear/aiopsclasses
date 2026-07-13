import Message from '../models/message.model.js';
import Batch from '../models/Batch.model.js';
import { NotFoundError, ValidationError } from '../utils/apiError.js';

const ADMIN_LEVELS = [1, 2];

function isAdmin(user) {
  return user?.role?.level && ADMIN_LEVELS.includes(user.role.level);
}

const messageService = {
  async send(batchId, senderId, content, type = 'text', user = null) {
    const batch = await Batch.findById(batchId).select('_id enrolledStudents');
    if (!batch) throw new NotFoundError('Batch');

    if (!isAdmin(user)) {
      const isEnrolled = batch.enrolledStudents.some(
        (s) => s.toString() === senderId.toString()
      );
      if (!isEnrolled) {
        throw new ValidationError('You are not enrolled in this batch');
      }
    }

    const message = await Message.create({
      batch: batchId,
      sender: senderId,
      content,
      type,
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email role avatar')
      .lean();

    return populated;
  },

  async getByBatch(batchId, userId, { page = 1, limit = 50 } = {}, user = null) {
    const batch = await Batch.findById(batchId).select('_id enrolledStudents');
    if (!batch) throw new NotFoundError('Batch');

    if (!isAdmin(user)) {
      const isMember = batch.enrolledStudents.some(
        (s) => s.toString() === userId.toString()
      );
      if (!isMember) {
        throw new ValidationError('You are not a member of this batch');
      }
    }

    const skip = (page - 1) * limit;
    const total = await Message.countDocuments({ batch: batchId });
    const messages = await Message.find({ batch: batchId })
      .populate('sender', 'name email role avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      messages: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async markAsRead(batchId, userId) {
    await Message.updateMany(
      { batch: batchId, 'readBy.user': { $ne: userId } },
      { $push: { readBy: { user: userId, readAt: new Date() } } }
    );
    return true;
  },

  async getUnreadCounts(userId, user = null) {
    const filter = isAdmin(user)
      ? { isActive: true }
      : { enrolledStudents: userId, isActive: true };

    const batches = await Batch.find(filter)
      .select('_id name')
      .lean();

    const counts = await Promise.all(
      batches.map(async (batch) => {
        const count = await Message.countDocuments({
          batch: batch._id,
          'readBy.user': { $ne: userId },
        });
        return { batchId: batch._id, batchName: batch.name, unreadCount: count };
      })
    );

    return counts.filter((c) => c.unreadCount > 0);
  },

  async delete(messageId, userId, user = null) {
    const message = await Message.findById(messageId);
    if (!message) throw new NotFoundError('Message');
    if (!isAdmin(user) && message.sender.toString() !== userId.toString()) {
      throw new ValidationError('You can only delete your own messages');
    }
    await Message.findByIdAndDelete(messageId);
    return true;
  },
};

export default messageService;
