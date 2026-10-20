import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import Product from "../models/product.model.js";
import verifySignature from "./verify.webhook.service.js";
import AppError from "../utils/apiError.js";
import mongoose from "mongoose";

const orderAgain = async (req) => {
  await verifySignature(req);

  const webhookData = JSON.parse(req.body.toString());

  if (webhookData.event !== "payment.captured") {
    return { ignored: true };
  }

  const entity = webhookData.payload?.payment?.entity;

  if (!entity?.id || !entity?.order_id) {
    throw new AppError(400, "Invalid payment payload");
  }

  const razorpayPaymentId = entity.id;
  const razorpayOrderId = entity.order_id;

  // Save only the payment id. status stays "failed" so a retry still matches.
  const capturedPayment = await Payment.findOneAndUpdate(
    { providerOrderId: razorpayOrderId, status: "failed" },
    { $set: { providerPaymentId: razorpayPaymentId, recoveryStatus: "pending" } },
    { new: true }
  );

  if (!capturedPayment) {
    throw new AppError(404, "Failed payment record not found");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const payment = await Payment.findOne({
      providerOrderId: razorpayOrderId,
      status: "failed",
      providerPaymentId: razorpayPaymentId,
      recoveryStatus: "pending"
    }).session(session);

    if (!payment) {
      throw new AppError(404, "Failed payment record not found");
    }

    const order = await Order.findOne({
      _id: payment.order,
      paymentMethod: "online",
      paymentStatus: "failed",
      orderStatus: "expired"
    }).session(session);

    // CHANGED (3): set recoveryCode on the error object itself
    if (!order) {
      const error = new AppError(409, "Order is not eligible for recovery");
      error.recoveryCode = "RECOVERY_NOT_POSSIBLE";
      throw error;
    }

    for (const item of order.items) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item.product,
          isActive: true,
          stock: { $gte: item.quantity }
        },
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );

      if (!product) {
        const error = new AppError(409, "Insufficient stock to recover order");
        error.recoveryCode = "RECOVERY_NOT_POSSIBLE";
        throw error;
      }
    }

    const updatePayment = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        status: "failed",
        providerPaymentId: razorpayPaymentId,
        recoveryStatus: "pending"
      },
      // CHANGED (1): money was received, so status becomes "paid"
      { $set: { status: "paid", recoveryStatus: "fulfilled" } },
      { new: true, session }
    );

    if (!updatePayment) {
      throw new AppError(409, "Payment state changed during recovery");
    }

    const updateOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        paymentMethod: "online",
        paymentStatus: "failed",
        orderStatus: "expired"
      },
      { $set: { paymentStatus: "paid", orderStatus: "confirmed" } },
      { new: true, session }
    );

    if (!updateOrder) {
      throw new AppError(409, "Order state changed during recovery");
    }

    await session.commitTransaction();

    return { order: updateOrder, payment: updatePayment };
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (err.recoveryCode === "RECOVERY_NOT_POSSIBLE") {
      
      await Payment.findOneAndUpdate(
        {
          providerOrderId: razorpayOrderId,
          status: "failed",
          providerPaymentId: razorpayPaymentId,
          recoveryStatus: "pending"
        },
        { $set: { status: "paid", recoveryStatus: "refund_pending" , refundStatus : "pending" } },
        { new: true }
      );
    }

    throw err;
  } finally {
    await session.endSession();
  }
};

export default orderAgain;