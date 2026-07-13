import { Router } from 'express';
import uploadService from '../services/upload.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middlewares/auth.middleware.js';
import { uploadImage } from '../middlewares/index.js';

const router = Router();

router.post(
  '/image',
  authenticate,
  uploadImage('file'),
  asyncHandler(async (req, res) => {
    const result = await uploadService.saveImage(req.file);
    return apiResponse.success(res, 'Image uploaded successfully', result, 201);
  })
);

router.delete(
  '/image/:filename',
  authenticate,
  asyncHandler(async (req, res) => {
    await uploadService.deleteImage(req.params.filename);
    return apiResponse.success(res, 'Image deleted successfully');
  })
);

export default router;
