import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['qr_transfer', 'upi', 'bank_transfer'],
      default: 'qr_transfer',
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    screenshot: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    paymentPlan: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'one_time'],
      default: 'one_time',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
