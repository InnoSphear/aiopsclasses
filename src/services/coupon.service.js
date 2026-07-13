import Coupon from '../models/Coupon.model.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/apiError.js';
import logger from '../utils/logger.js';

const couponService = {
  async getAll({ page = 1, limit = 20, isActive }) {
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;

    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'name email')
      .populate('applicableCourses', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { coupons, total };
  },

  async getById(id) {
    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'name email')
      .populate('applicableCourses', 'name code')
      .lean();

    if (!coupon) {
      throw new NotFoundError('Coupon');
    }
    return coupon;
  },

  async create(data, createdBy) {
    const existing = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
    if (existing) {
      throw new ConflictError('A coupon with this code already exists');
    }

    const coupon = await Coupon.create({
      ...data,
      code: data.code.toUpperCase().trim(),
      createdBy,
    });

    logger.info(`Coupon created: ${coupon.code} by ${createdBy || 'system'}`);
    return coupon;
  },

  async update(id, data, updatedBy) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError('Coupon');
    }

    if (data.code && data.code.toUpperCase().trim() !== coupon.code) {
      const existing = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
      if (existing) {
        throw new ConflictError('A coupon with this code already exists');
      }
      data.code = data.code.toUpperCase().trim();
    }

    const updated = await Coupon.findByIdAndUpdate(id, data, { new: true });
    logger.info(`Coupon ${id} updated by ${updatedBy || 'system'}`);
    return updated;
  },

  async delete(id, deletedBy) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError('Coupon');
    }

    await Coupon.findByIdAndDelete(id);
    logger.info(`Coupon ${id} deleted by ${deletedBy || 'system'}`);
    return true;
  },

  async validate(code, amount, courseId) {
    if (!code) {
      throw new ValidationError('Coupon code is required');
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      throw new ValidationError('Invalid coupon code');
    }

    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      throw new ValidationError('This coupon has expired');
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new ValidationError('This coupon has reached its usage limit');
    }

    if (coupon.minAmount > 0 && amount < coupon.minAmount) {
      throw new ValidationError(`Minimum amount for this coupon is ₹${coupon.minAmount}`);
    }

    if (!coupon.allCourses && coupon.applicableCourses?.length > 0 && courseId) {
      const isApplicable = coupon.applicableCourses.some(
        (c) => c.toString() === courseId.toString()
      );
      if (!isApplicable) {
        throw new ValidationError('This coupon is not applicable for the selected course');
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = Math.round((amount * coupon.discountValue) / 100);
      if (coupon.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, amount);
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    return {
      valid: true,
      couponCode: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: discountAmount,
      originalAmount: amount,
      finalAmount,
      message: `Coupon applied! ₹${discountAmount} off`,
    };
  },

  async incrementUsage(code) {
    await Coupon.findOneAndUpdate(
      { code: code.toUpperCase().trim() },
      { $inc: { usedCount: 1 } }
    );
  },
};

export default couponService;
