import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [200, 'Course name must be at most 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
      default: '',
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description must be at most 300 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: ['bca', 'mca', 'certification', 'other'],
      required: [true, 'Category is required'],
    },
    duration: {
      value: { type: Number, default: 1 },
      unit: { type: String, enum: ['months', 'years', 'semesters'], default: 'years' },
    },
    fee: {
      type: Number,
      default: 0,
      min: [0, 'Fee cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    syllabus: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        topics: [{ type: String }],
      },
    ],
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    maxEnrollment: {
      type: Number,
      default: 0,
    },
    tags: [{ type: String, trim: true }],
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseSchema.index({ name: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1, isActive: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
