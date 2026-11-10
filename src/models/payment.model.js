
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Overall amount expected for this business order.
    // Keep the same units as your existing application.
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      required: true,
    },

    provider: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
      required: true,
    },

    // Overall financial state, not an individual attempt's state.
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
      required: true,
    },

    // Tracks fulfilment recovery after payment.
    recoveryStatus: {
      type: String,
      enum: [
        "not_required",
        "pending",
        "processing",
        "fulfilled",
        "refund_pending",
        "refunded",
        "failed",
      ],
      default: "not_required",
      required: true,
    },
    
    // Overall refund workflow summary.
    refundStatus: {
      type: String,
      enum: [
        "not_required",
        "pending",
        "processing",
        "processed",
        "failed",
      ],
      default: "not_required",
      required: true,
    },
    PaymentAttempt:{
    type : mongoose.Schema.Types.ObjectId,
    ref : "PaymentAttempt",
  },
  },
  
  {
    timestamps: true,
  }
);

paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
