import mongoose from 'mongoose';
import { userRepository, roleRepository } from '../repositories/index.js';
import { NotFoundError, ConflictError } from '../utils/apiError.js';
import logger from '../utils/logger.js';
import Batch from '../models/Batch.model.js';
import Payment from '../models/Payment.model.js';

const userService = {
  async getAll({ page = 1, limit = 10, sort = { createdAt: -1 }, search, role, isActive }) {
    const filter = { isDeleted: false };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      if (mongoose.Types.ObjectId.isValid(role)) {
        filter.role = role;
      } else {
        const roleDoc = await roleRepository.findByName(role);
        if (roleDoc) {
          filter.role = roleDoc._id;
        } else {
          return { users: [], total: 0 };
        }
      }
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    const { docs, total } = await userRepository.find(filter, {
      page,
      limit,
      sort,
      populate: { path: 'role', select: 'name displayName level' },
    });

    return { users: docs, total };
  },

  async getById(id) {
    const user = await userRepository.findById(id, {
      path: 'role',
      select: 'name displayName level permissions',
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  },

  async create(data, createdBy) {
    const { name, email, phone, password, role } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    let roleId = role;
    if (role) {
      const roleDoc = await roleRepository.findByName(role);
      if (!roleDoc) {
        roleId = role;
      } else {
        roleId = roleDoc._id;
      }
    } else {
      const studentRole = await roleRepository.findByName('student');
      if (studentRole) {
        roleId = studentRole._id;
      }
    }

    const nonStudentRoles = ['superadmin', 'admin', 'faculty', 'mentor', 'coordinator', 'counselor', 'sales'];
    const roleName = typeof roleId === 'object' ? roleId.toString() : roleId;
    const isStaff = nonStudentRoles.some(r => {
      const rLower = r.toLowerCase();
      const idStr = roleId?.toString?.() || roleId;
      return idStr === rLower;
    });

    const user = await userRepository.create({
      name,
      email,
      phone: phone || undefined,
      password,
      role: roleId,
      isActive: true,
      isEmailVerified: true,
      accountStatus: 'active',
      paymentStatus: 'verified',
    });

    const populatedUser = await userRepository.findById(user._id, {
      path: 'role',
      select: 'name displayName level',
    });

    logger.info(`User created: ${email} by ${createdBy || 'system'}`);

    return populatedUser;
  },

  async update(id, data, updatedBy) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictError('Email is already in use');
      }
    }

    const updatedUser = await userRepository.update(id, data);

    logger.info(`User ${id} updated by ${updatedBy || 'system'}`);

    return updatedUser;
  },

  async delete(id, deletedBy) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    await Batch.updateMany(
      { enrolledStudents: id },
      { $pull: { enrolledStudents: id } }
    );

    await Payment.deleteMany({ user: id });

    await userRepository.model.findByIdAndDelete(id);

    logger.info(`User ${id} (${user.email}) hard-deleted by ${deletedBy || 'system'}`);

    return true;
  },

  async getStats() {
    const totalUsers = await userRepository.count({ isDeleted: false });
    const activeUsers = await userRepository.count({ isDeleted: false, isActive: true });
    const inactiveUsers = await userRepository.count({ isDeleted: false, isActive: false });
    const verifiedUsers = await userRepository.count({ isDeleted: false, isEmailVerified: true });

    const roleStats = await userRepository.model.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleInfo',
        },
      },
      { $unwind: { path: '$roleInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$role',
          roleName: { $first: '$roleInfo.displayName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      verifiedUsers,
      roleBreakdown: roleStats,
    };
  },
};

export default userService;
