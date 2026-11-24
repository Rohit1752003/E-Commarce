    import mongoose from "mongoose";
    import AppError from "../utils/apiError.js";
    import Payment from "../models/payment.model.js";
    import ApiResponse from "../utils/apiResponce.js";
    import Order from '../models/order.model.js'
    import verifySignature  from '../services/verify.webhook.service.js'
    import PaymentAttempt from "../models/payment_Attempt.model.js";
    import WebhookEvent from "../models/webhookEvent.model.js";
// -----------
// -------------- 

 const verifyWebHookData = (webhookData, paymentAttempt) => {
    const paymentEntity = webhookData?.payload?.payment?.entity;

    if (!paymentEntity) {
        throw new AppError(400, "Invalid Webhook Payload");
    }

    const {
        id,
        order_id,
        amount,
        currency,
        status,
        captured
    } = paymentEntity;

    if (!id || !order_id) {
        throw new AppError(400, "Payment Details Missing");
    }

    if (status !== "captured" || captured !== true) {
        throw new AppError(400, "Payment Is Not Captured");
    }

    if (amount !== paymentAttempt.amountPaise) {
        throw new AppError(400, "Payment Amount Mismatch");
    }

    if (currency !== paymentAttempt.currency) {
        throw new AppError(400, "Payment Currency Mismatch");
    }

    if (order_id !== paymentAttempt.providerOrderId) {
        throw new AppError(400, "Payment Order ID Mismatch");
    }

    return {
        razorpayPaymentId: id,
        razorpayOrderId: order_id
    };
};

// -----------
// -------------- 


 const webHook = async (req, res) => {
    
    // BLOCK 1: Verify raw webhook signature
  await verifySignature(req);

  const webhookData = JSON.parse(req.body.toString());

  // BLOCK 2: Validate event
  if (webhookData.event !== "payment.captured") {
    return res.status(200).json(
      new ApiResponse(200, "Webhook event received")
    );
  }

  const eventId = req.headers["x-razorpay-event-id"];

  if (!eventId) {
    throw new AppError(400, "Webhook event ID missing");
  }

  // BLOCK 3: Find and validate PaymentAttempt
  const paymentEntity = webhookData.payload?.payment?.entity;

  if (!paymentEntity?.order_id) {
    throw new AppError(400, "Invalid webhook payment data");
  }

  const paymentAttempt = await PaymentAttempt.findOne({
    provider: "razorpay",
    providerOrderId: paymentEntity.order_id,
  });

  if (!paymentAttempt) {
    throw new AppError(404, "Payment attempt does not exist");
  }

  const {
    razorpayPaymentId,
    razorpayOrderId,
  } = verifyWebHookData(webhookData, paymentAttempt);

 if (paymentAttempt.status === "captured") {
    if (paymentAttempt.providerPaymentId !== razorpayPaymentId) {
        throw new AppError(409, "Payment ID mismatch");
    }

    const parentPayment = await Payment.findById(
        paymentAttempt.payment
    );

    const order = await Order.findById(
        paymentAttempt.order
    );

    if (
        parentPayment?.status === "paid" &&
        order?.paymentStatus === "paid"
    ) {
        return res.status(200).json(
            new ApiResponse(200, "Payment already processed")
        );
    }

    throw new AppError(
        409,
        "Payment records are inconsistent. Reconciliation required."
    );
}
    const session = await mongoose.startSession();
    
    try{
        session.startTransaction();
        const webhookEvent = new WebhookEvent({
    eventId,
    provider: "razorpay",
    eventType: webhookData.event,
    status: "processing"
});

await webhookEvent.save({ session });
        const freshPaymentAttempt = await PaymentAttempt.findOneAndUpdate(
  {
                _id: paymentAttempt._id,
                provider: "razorpay",
                providerOrderId: razorpayOrderId,
                status: { $in: ["created", "pending"] }
            },
            {
               $set: {
                status: "captured",
                providerPaymentId: razorpayPaymentId 
                },
                $unset: {
                expiresAt: 1
                }
            },
            {
                new: true,
                session,
                runValidators: true
            });

        if(!freshPaymentAttempt){
            throw new AppError(400 , "Payment is Already Processed Once")
        }
        const updatePayment = await Payment.findOneAndUpdate(
            {
                _id : freshPaymentAttempt.payment,
                   order: freshPaymentAttempt.order,
                status : "pending"
            } , 
                {
                    $set :{
                        status : "paid",
                       
                    }
                },
                {
                    new : true,
                session
                }

            )
    if (!updatePayment) {
    throw new AppError(400 , "Request is already processed once")
}

const order = await Order.findOneAndUpdate(
    {
        _id :  updatePayment.order,
        paymentStatus : "pending",
        orderStatus : "pending",
        paymentMethod : "online"
    }, 
    {
        $set :{
            paymentStatus : "paid"
        },
        $unset : {
            paymentDeadline : 1
        }

    },
    {
    new : true, 
    session
    }
)
         if (!order) {
      throw new AppError(
        404,
        "Order Does not Exist"
      );
    }



    const eventUpdate = await WebhookEvent.updateOne(
    {
        provider: "razorpay",
        eventId,
        status: "processing"
    },
    {
        $set: {
            status: "processed",
            processedAt: new Date()
        }
    },
    { session }
);

if (eventUpdate.matchedCount !== 1) {
    throw new AppError(409, "Webhook event state could not be updated");
}

   
    await session.commitTransaction();

    return res.status(200).json(
        new ApiResponse(
        200,
        "Webhook received successfully"
        )
    );


    }catch(err){
       if (session.inTransaction()) {
      await session.abortTransaction();
    }   
  const isDuplicateWebhookEvent =
    err.code === 11000 &&
    err.keyPattern?.provider === 1 &&
    err.keyPattern?.eventId === 1;

if (isDuplicateWebhookEvent) {
    return res.status(200).json(
        new ApiResponse(200, "Duplicate webhook event ignored")
    );
}
            throw err;
        
    }finally{
        await session.endSession();
    }
    
    };

    export { webHook };