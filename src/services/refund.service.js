

  const refundService = async (paymentId) => {
  
    const payment = await Payment.findOne({
      _id: paymentId,
    refundStatus: { $in: ["pending", "failed"] },
      recoveryStatus: "refund_pending",
      status: "paid",
    });
    if(!payment) {
      throw new AppError(
        404,
        "Payment not found"
      );
    }
    if(payment.providerPaymentId === null || payment.providerPaymentId === undefined) {
      throw new AppError(
        400,
        "Payment does not have a provider payment ID"
      );
    }
    let idempotencyKey = payment.refundIdempotencyKey;

  if (!idempotencyKey) {
    idempotencyKey = `refund_${payment._id}_${payment.order}_${payment.refundAttempt }`;

    payment.refundIdempotencyKey = idempotencyKey;
    await payment.save();
  }
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${payment.providerPaymentId}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "X-Refund-Idempotency": payment.refundIdempotencyKey,
      },
      body: JSON.stringify({
        amount: Math.round(payment.amount * 100),
        receipt: String(payment._id),
        notes: { orderId: String(payment.order) },
      }),
    }
  );

  const refund = await response.json();

  if (!response.ok) {
    const err = new AppError(502, refund.error?.description || "Razorpay refund request failed");
    err.retryable = response.status >= 500;
    throw err;
  }
  const update = {
    providerRefundId: refund.id,
  };

  if (refund.status === "processed") {
    update.refundStatus = "processed";
    update.recoveryStatus = "refunded";
    update.status = "refunded";
  } else if (refund.status === "failed") {
    update.refundStatus = "failed";
    update.recoveryStatus = "refund_pending";
      update.refundAttempt = payment.refundAttempt + 1;
  } else if (refund.status === "pending") {
    update.refundStatus = "processing";
    update.recoveryStatus = "refund_pending";

  }
  else {
    throw new AppError(
      502,
      `Unexpected Razorpay refund status: ${refund.status}`
    );
  }

  const updatedPayment = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      refundStatus: { $in: ["pending", "failed"] },
      recoveryStatus: "refund_pending",
    },
    {
      $set: update,
      
    },
    { new: true }
  );

  if (!updatedPayment) {
    throw new AppError(
      409,
      "Could not update refund state"
    );
  }

  return {
    payment: updatedPayment,
    refund,
  };
  }
  export default refundService;