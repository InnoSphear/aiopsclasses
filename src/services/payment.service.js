import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import { NotFoundError, ValidationError } from '../utils/apiError.js';

const paymentService = {
  async createPayment(data) {
    const user = await User.findById(data.userId).select('selectedCourse selectedCourseName paymentPlan');
    let amount = data.amount || 0;

    if (!amount && user?.selectedCourse) {
      const course = await Course.findById(user.selectedCourse);
      if (course) {
        amount = course.fee || 0;
      }
    }

    if (!amount) {
      amount = 0;
    }

    const payment = await Payment.create({
      user: data.userId,
      amount: data.amount || amount,
      paymentMethod: data.paymentMethod || 'qr_transfer',
      transactionId: data.transactionId || '',
      screenshot: data.screenshot || { url: '', publicId: '' },
      paymentPlan: data.paymentPlan || user?.paymentPlan || 'monthly',
      status: 'pending',
    });

    await User.findByIdAndUpdate(data.userId, {
      paymentStatus: 'pending_verification',
      accountStatus: 'pending_verification',
      paymentId: payment._id,
    });

    return payment;
  },

  async getMyPayment(userId) {
    const payment = await Payment.findOne({ user: userId }).sort({ createdAt: -1 });
    return payment;
  },

  async getAllPending() {
    const payments = await Payment.find({ status: 'pending' })
      .populate('user', 'name email phone selectedCourseName paymentPlan accountStatus selectedCourse')
      .populate({
        path: 'user',
        populate: { path: 'selectedCourse', select: 'name code fee' },
      })
      .sort({ createdAt: -1 });

    const paidUserIds = payments.map((p) => p.user?._id?.toString()).filter(Boolean);

    const unpaidUsers = await User.find({
      accountStatus: { $in: ['pending_payment', 'pending_verification'] },
      role: { $ne: null },
    })
      .populate('role', 'name')
      .populate('selectedCourse', 'name code fee')
      .sort({ createdAt: -1 });

    const filteredUnpaid = unpaidUsers.filter(
      (u) => u.role?.name === 'student' && !paidUserIds.includes(u._id.toString())
    );

    const unpaidAsPayments = filteredUnpaid.map((u) => ({
      _id: u._id,
      user: {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        selectedCourseName: u.selectedCourseName || u.selectedCourse?.name || '',
        selectedCourse: u.selectedCourse,
        paymentPlan: u.paymentPlan || 'monthly',
        monthlyFee: u.selectedCourse?.fee || 0,
      },
      amount: u.selectedCourse?.fee || 0,
      status: 'no_payment',
      paymentPlan: u.paymentPlan || 'monthly',
      createdAt: u.createdAt,
      isUnpaidUser: true,
    }));

    return [...unpaidAsPayments, ...payments];
  },

  async approvePayment(paymentId, verifiedById) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      const user = await User.findById(paymentId);
      if (!user) throw new NotFoundError('Payment or User');
      await User.findByIdAndUpdate(user._id, {
        paymentStatus: 'verified',
        accountStatus: 'active',
        verifiedBy: verifiedById,
        verifiedAt: new Date(),
      });
      return { message: 'User activated directly (no payment record)', userId: user._id };
    }
    if (payment.status !== 'pending') throw new ValidationError('Payment already processed');

    payment.status = 'approved';
    payment.verifiedBy = verifiedById;
    payment.verifiedAt = new Date();
    await payment.save();

    await User.findByIdAndUpdate(payment.user, {
      paymentStatus: 'verified',
      accountStatus: 'active',
      verifiedBy: verifiedById,
      verifiedAt: new Date(),
    });

    return payment;
  },

  async rejectPayment(paymentId, verifiedById, reason) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      const user = await User.findById(paymentId);
      if (!user) throw new NotFoundError('Payment or User');
      await User.findByIdAndUpdate(user._id, {
        paymentStatus: 'rejected',
        accountStatus: 'rejected',
        rejectionReason: reason || 'Payment not verified',
      });
      return { message: 'User rejected (no payment record)', userId: user._id };
    }
    if (payment.status !== 'pending') throw new ValidationError('Payment already processed');

    payment.status = 'rejected';
    payment.verifiedBy = verifiedById;
    payment.verifiedAt = new Date();
    payment.rejectionReason = reason || '';
    await payment.save();

    await User.findByIdAndUpdate(payment.user, {
      paymentStatus: 'rejected',
      accountStatus: 'rejected',
      rejectionReason: reason || 'Payment not verified',
    });

    return payment;
  },

  async getPaymentStats() {
    const stats = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);
    return stats;
  },

  async getAllPayments({ page = 1, limit = 20, status, batch, search }) {
    let userIds = null;
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      userIds = users.map((u) => u._id);
    }

    let batchUserIds = null;
    if (batch) {
      const Batch = (await import('../models/Batch.model.js')).default;
      const batchDoc = await Batch.findById(batch).select('enrolledStudents');
      if (batchDoc) {
        batchUserIds = (batchDoc.enrolledStudents || []).map((s) => s.toString());
      } else {
        batchUserIds = [];
      }
    }

    const buildUserFilter = () => {
      const f = {};
      if (userIds && batchUserIds) {
        const intersection = userIds.filter((id) => batchUserIds.includes(id.toString()));
        f._id = { $in: intersection };
      } else if (userIds) {
        f._id = { $in: userIds };
      } else if (batchUserIds) {
        f._id = { $in: batchUserIds };
      }
      f.role = { $ne: null };
      return f;
    };

    let unpaidUsers = [];
    if (!status || status === 'no_payment') {
      const userFilter = {
        ...buildUserFilter(),
        accountStatus: { $in: ['pending_payment', 'pending_verification'] },
      };
      const unpaid = await User.find(userFilter)
        .populate('role', 'name')
        .populate('selectedCourse', 'name code fee')
        .sort({ createdAt: -1 })
        .lean();

      const filteredUnpaid = unpaid.filter((u) => {
        if (u.role?.name !== 'student') return false;
        return true;
      });

      unpaidUsers = filteredUnpaid.map((u) => ({
        _id: u._id,
        user: {
          _id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          selectedCourseName: u.selectedCourseName || u.selectedCourse?.name || '',
          selectedCourse: u.selectedCourse,
          paymentPlan: u.paymentPlan || 'monthly',
          monthlyFee: u.selectedCourse?.fee || 0,
        },
        amount: u.selectedCourse?.fee || 0,
        status: 'no_payment',
        paymentPlan: u.paymentPlan || 'monthly',
        createdAt: u.createdAt,
        isUnpaidUser: true,
      }));
    }

    const paymentFilter = {};
    if (status && status !== 'no_payment') paymentFilter.status = status;

    if (userIds) paymentFilter.user = { $in: userIds };
    if (batchUserIds) {
      if (userIds) {
        const intersection = userIds.filter((id) => batchUserIds.includes(id.toString()));
        paymentFilter.user = { $in: intersection };
      } else {
        paymentFilter.user = { $in: batchUserIds };
      }
    }

    const skip = (page - 1) * limit;
    const totalPayments = await Payment.countDocuments(paymentFilter);
    const payments = await Payment.find(paymentFilter)
      .populate('user', 'name email phone selectedCourseName paymentPlan accountStatus paymentStatus selectedCourse')
      .populate({ path: 'user', populate: { path: 'selectedCourse', select: 'name code fee' } })
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const allItems = [...unpaidUsers, ...payments];
    const total = allItems.length;
    const paginatedItems = allItems.slice(skip, skip + limit);

    return {
      payments: paginatedItems,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async getMyPaymentStatus(userId) {
    const user = await User.findById(userId)
      .select('accountStatus paymentStatus selectedCourseName selectedCourse paymentPlan')
      .populate('selectedCourse', 'name code fee category');
    const payment = await Payment.findOne({ user: userId }).sort({ createdAt: -1 }).select('status amount transactionId createdAt');
    const paymentPlan = user?.paymentPlan || 'monthly';

    const courseFee = user?.selectedCourse?.fee || 0;

    return {
      accountStatus: user?.accountStatus || 'pending_payment',
      paymentStatus: user?.paymentStatus || 'pending',
      selectedCourseName: user?.selectedCourseName || user?.selectedCourse?.name || '',
      selectedCourse: user?.selectedCourse || null,
      paymentPlan,
      monthlyFee: courseFee,
      payment: payment || null,
    };
  },
};

export default paymentService;
