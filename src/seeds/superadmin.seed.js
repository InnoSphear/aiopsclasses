import User from '../models/User.model.js';
import Role from '../models/Role.model.js';
import logger from '../utils/logger.js';

const SUPERADMIN_DATA = {
  name: 'Ujjwal Karmakar',
  email: 'ujjwalkarmakar@aiopsmedia.com',
  password: 'Admin@321',
  isEmailVerified: true,
  isActive: true,
};

const seedSuperAdmin = async () => {
  try {
    const superAdminRole = await Role.findOne({ name: 'superadmin' });
    if (!superAdminRole) {
      logger.error('Superadmin role not found. Run roles seed first.');
      return null;
    }

    const existingUser = await User.findOne({ email: SUPERADMIN_DATA.email });
    if (existingUser) {
      const needsUpdate = existingUser.accountStatus !== 'active' || existingUser.paymentStatus !== 'verified';
      if (needsUpdate) {
        existingUser.accountStatus = 'active';
        existingUser.paymentStatus = 'verified';
        await existingUser.save();
        logger.info(`Superadmin account status updated to active: ${SUPERADMIN_DATA.email}`);
      } else {
        logger.info(`Superadmin user already exists: ${SUPERADMIN_DATA.email}`);
      }
      return existingUser;
    }

    const user = await User.create({
      name: SUPERADMIN_DATA.name,
      email: SUPERADMIN_DATA.email,
      password: SUPERADMIN_DATA.password,
      role: superAdminRole._id,
      isEmailVerified: SUPERADMIN_DATA.isEmailVerified,
      isActive: SUPERADMIN_DATA.isActive,
      accountStatus: 'active',
      paymentStatus: 'verified',
    });

    logger.info(`Superadmin user created: ${SUPERADMIN_DATA.email}`);
    return user;
  } catch (error) {
    logger.error('Error seeding superadmin:', error);
    throw error;
  }
};

export default seedSuperAdmin;
