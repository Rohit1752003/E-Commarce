    import crypto from "crypto";
    import mongoose from "mongoose";
    import AppError from "../utils/apiError.js";
    import Payment from "../models/payment.model.js";
    import ApiResponse from "../utils/apiResponce.js";
    import Order from '../models/order.model.js'
    const webHook = async (req, res) => {

    const signature =
        req.headers["x-razorpay-signature"];

    if (!signature) {
        throw new AppError(
        400,
        "Razorpay webhook signature missing"
        );
    }

    const data = req.body;

    const generateSignature = crypto
        .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(data)
        .digest("hex");

    if (generateSignature !== signature) {
        throw new AppError(
        400,
        "Payment Verification failed"
        );
    }

    const webhookData =
        JSON.parse(data.toString());

    const razorpayPaymentId =
        webhookData.payload.payment.entity.id;

    const razorpayOrderId =
        webhookData.payload.payment.entity.order_id;


       

    const session = await mongoose.startSession();

    if (webhookData.event !== "payment.captured") {
    return res.status(200).json(
        new ApiResponse(
            200,
            "Webhook event received"
        )
    );
}
    try{
        session.startTransaction();
      
            const updatePayment = await Payment.findOneAndUpdate({providerOrderId : razorpayOrderId ,status : "pending"} , 
                {
                    $set :{
                        status : "paid",
                        providerPaymentId : razorpayPaymentId
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

const order = await Order.findOneAndUpdate({_id :  updatePayment.order}, 
    {
        $set :{
            paymentStatus : "paid"
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
            throw err;
        
    }finally{
        await session.endSession();
    }
    
    };

    export { webHook };