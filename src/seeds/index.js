import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import 'dotenv/config';
import { connectDB } from '../config/database.js';
import logger from '../utils/logger.js';
import seedRoles from './roles.seed.js';
import seedSuperAdmin from './superadmin.seed.js';

const runSeeds = async () => {
  try {
    logger.info('Starting database seeding...');

    await connectDB();

    logger.info('Seeding roles...');
    await seedRoles();

    logger.info('Seeding superadmin user...');
    await seedSuperAdmin();

    logger.info('Database seeding completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

runSeeds();
