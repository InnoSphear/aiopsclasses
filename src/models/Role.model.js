import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      lowercase: true,
      trim: true,
      enum: {
        values: ['superadmin', 'admin', 'faculty', 'mentor', 'coordinator', 'counselor', 'sales', 'student'],
        message: '{VALUE} is not a valid role name',
      },
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    level: {
      type: Number,
      required: [true, 'Role level is required'],
      min: [1, 'Level must be at least 1'],
      max: [8, 'Level must be at most 8'],
    },
    permissions: {
      type: [String],
      default: [],
      index: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Role = mongoose.model('Role', roleSchema);

export default Role;
