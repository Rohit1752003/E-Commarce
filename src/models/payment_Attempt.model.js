
import mongoose from "mongoose";

const paymentAttemptSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
      required: true,
    },

    providerOrderId: {
      type: String,
      required: true,
    },

    providerPaymentId: {
      type: String,
      default: null,
    
    },

    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "amountPaise must be a safe integer",
      },
    },

    currency: {
      type: String,
      default: "INR",
      required: true,
      enum: ["INR"],
    },

    status: {
      type: String,
      enum: ["created", "pending", "expired", "failed", "captured"],
      default: "created",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    capturedAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

paymentAttemptSchema.index(
  { providerOrderId: 1 },
  { unique: true }
);

paymentAttemptSchema.index(
  { providerPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerPaymentId: { $type: "string" },
    },
  }
);

paymentAttemptSchema.index({ payment: 1, createdAt: -1 });
const PaymentAttempt = mongoose.model(
  "PaymentAttempt",
  paymentAttemptSchema
);

export default PaymentAttempt;
