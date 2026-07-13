import Role from '../models/Role.model.js';
import logger from '../utils/logger.js';

const roles = [
  {
    name: 'superadmin',
    displayName: 'Super Admin',
    description: 'Full system access',
    level: 1,
    isSystemRole: true,
    permissions: ['*'],
  },
  {
    name: 'admin',
    displayName: 'Admin',
    description: 'Operations manager',
    level: 2,
    isSystemRole: true,
    permissions: [
      'users:list', 'users:read', 'users:create', 'users:update',
      'courses:list', 'courses:read', 'courses:create', 'courses:update', 'courses:delete', 'courses:publish',
      'batches:list', 'batches:read', 'batches:create', 'batches:update', 'batches:enroll',
      'enrollments:list', 'enrollments:read', 'enrollments:create', 'enrollments:update',
      'payments:list', 'payments:read', 'payments:approve', 'payments:reject', 'payments:refund', 'payments:coupons',
      'attendance:list', 'attendance:read', 'attendance:mark', 'attendance:update', 'attendance:export',
      'reports:view', 'reports:export',
      'leads:list', 'leads:read', 'leads:create', 'leads:update', 'leads:assign', 'leads:convert',
      'announcements:list', 'announcements:read', 'announcements:create', 'announcements:update', 'announcements:delete',
      'certificates:list', 'certificates:read', 'certificates:issue',
      'blogs:list', 'blogs:read', 'blogs:create', 'blogs:update', 'blogs:delete',
    ],
  },
  {
    name: 'faculty',
    displayName: 'Faculty',
    description: 'Teachers and instructors',
    level: 3,
    isSystemRole: true,
    permissions: [
      'courses:list', 'courses:read', 'courses:update',
      'modules:list', 'modules:read', 'modules:create', 'modules:update',
      'lessons:list', 'lessons:read', 'lessons:create', 'lessons:update',
      'batches:list', 'batches:read',
      'enrollments:read',
      'liveclasses:list', 'liveclasses:read', 'liveclasses:create', 'liveclasses:update', 'liveclasses:conduct', 'liveclasses:join',
      'assignments:list', 'assignments:read', 'assignments:create', 'assignments:update', 'assignments:grade',
      'quizzes:list', 'quizzes:read', 'quizzes:create', 'quizzes:update', 'quizzes:grade',
      'attendance:list', 'attendance:read', 'attendance:mark', 'attendance:update', 'attendance:export',
      'chats:read', 'chats:create', 'chats:message',
      'notifications:read',
      'announcements:list', 'announcements:read', 'announcements:create', 'announcements:update',
      'blogs:read',
      'reports:view',
    ],
  },
  {
    name: 'mentor',
    displayName: 'Mentor',
    description: 'Student guides',
    level: 4,
    isSystemRole: true,
    permissions: [
      'courses:list', 'courses:read',
      'batches:list', 'batches:read',
      'enrollments:read',
      'liveclasses:read', 'liveclasses:join',
      'assignments:read', 'assignments:grade',
      'quizzes:read',
      'attendance:read',
      'chats:read', 'chats:create', 'chats:message',
      'notifications:read',
      'blogs:read',
    ],
  },
  {
    name: 'coordinator',
    displayName: 'Coordinator',
    description: 'Batch coordinator',
    level: 5,
    isSystemRole: true,
    permissions: [
      'batches:list', 'batches:read', 'batches:update',
      'enrollments:read',
      'attendance:list', 'attendance:read', 'attendance:mark', 'attendance:update', 'attendance:export', 'attendance:leave_approve',
      'liveclasses:list', 'liveclasses:read',
      'chats:read', 'chats:create', 'chats:message',
      'notifications:read',
      'announcements:list', 'announcements:read', 'announcements:create',
      'blogs:read',
    ],
  },
  {
    name: 'counselor',
    displayName: 'Counselor',
    description: 'Lead management',
    level: 6,
    isSystemRole: true,
    permissions: [
      'leads:list', 'leads:read', 'leads:create', 'leads:update', 'leads:convert',
      'chats:read', 'chats:create', 'chats:message',
      'notifications:read',
      'blogs:read',
    ],
  },
  {
    name: 'sales',
    displayName: 'Sales',
    description: 'Sales team',
    level: 7,
    isSystemRole: true,
    permissions: [
      'leads:list', 'leads:read', 'leads:create', 'leads:update',
      'chats:read', 'chats:create', 'chats:message',
      'notifications:read',
      'blogs:read',
    ],
  },
  {
    name: 'student',
    displayName: 'Student',
    description: 'Enrolled learners',
    level: 8,
    isSystemRole: true,
    permissions: [
      'courses:read', 'modules:read', 'lessons:read',
      'batches:read',
      'enrollments:read',
      'liveclasses:read', 'liveclasses:join',
      'assignments:read', 'assignments:submit',
      'quizzes:read', 'quizzes:attempt',
      'attendance:read', 'attendance:leave_request',
      'payments:create', 'payments:read',
      'chats:read', 'chats:create', 'chats:message',
      'notifications:read',
      'announcements:read',
      'certificates:read',
      'blogs:read',
      'placement:companies', 'placement:jobs', 'placement:applications', 'placement:resume',
    ],
  },
];

const seedRoles = async () => {
  try {
    const existingRoles = await Role.find({});
    const existingMap = new Map(existingRoles.map((r) => [r.name, r]));

    const results = { created: 0, updated: 0, unchanged: 0 };

    for (const roleData of roles) {
      const existing = existingMap.get(roleData.name);

      if (!existing) {
        await Role.create(roleData);
        results.created++;
        logger.info(`Created role: ${roleData.name}`);
      } else {
        const permissionsChanged =
          JSON.stringify([...existing.permissions].sort()) !==
          JSON.stringify([...roleData.permissions].sort());

        const displayNameChanged = existing.displayName !== roleData.displayName;
        const descriptionChanged = existing.description !== roleData.description;
        const levelChanged = existing.level !== roleData.level;

        if (permissionsChanged || displayNameChanged || descriptionChanged || levelChanged) {
          await Role.findByIdAndUpdate(existing._id, {
            displayName: roleData.displayName,
            description: roleData.description,
            level: roleData.level,
            permissions: roleData.permissions,
          });
          results.updated++;
          logger.info(`Updated role: ${roleData.name}`);
        } else {
          results.unchanged++;
        }
      }
    }

    logger.info(
      `Role seeding complete: ${results.created} created, ${results.updated} updated, ${results.unchanged} unchanged`
    );

    return results;
  } catch (error) {
    logger.error('Error seeding roles:', error);
    throw error;
  }
};

export default seedRoles;
