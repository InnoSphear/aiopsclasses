import multer from 'multer';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const storage = multer.memoryStorage();

/**
 * File filter that accepts images, documents, and videos.
 * @param {import('express').Request} req
 * @param {Express.Multer.File} file
 * @param {multer.FileFilterCallback} cb
 */
const fileFilter = (req, file, cb) => {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Middleware for single file upload.
 * @param {string} fieldName - Form field name for the file.
 * @returns {import('express').RequestHandler}
 */
export const uploadSingle = (fieldName) => upload.single(fieldName);

/**
 * Middleware for multiple files upload with same field name.
 * @param {string} fieldName - Form field name.
 * @param {number} maxCount - Maximum number of files.
 * @returns {import('express').RequestHandler}
 */
export const uploadMultiple = (fieldName, maxCount = 10) =>
  upload.array(fieldName, maxCount);

/**
 * Middleware for multiple fields with different files.
 * @param {Array<{ name: string, maxCount: number }>} fields - Field configurations.
 * @returns {import('express').RequestHandler}
 */
export const uploadFields = (fields) => upload.fields(fields);

/**
 * Middleware for image-only uploads.
 * @param {string} fieldName - Form field name.
 * @returns {import('express').RequestHandler}
 */
export const uploadImage = (fieldName) => {
  const imageFilter = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  });
  return imageFilter.single(fieldName);
};

export default upload;
