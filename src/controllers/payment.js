import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import AppError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponce.js";
import User from "../models/user.model.js";
import razorpay from "../config/razorPay.js";
import crypto from 'crypto'
import mongoose from "mongoose";
import Product from "../models/product.model.js";


const createPayment = async (req, res) => {
//     console.log(
//   "RAZORPAY_KEY_ID:",
//   process.env.RAZORPAY_KEY_ID
// );

// console.log(
//   "RAZORPAY_KEY_SECRET:",
//   process.env.RAZORPAY_KEY_SECRET
//     ? "EXISTS"
//     : "MISSING"
// );
    const { orderId } = req.params;
    const userId = req.userId;
//     console.log("orderId:", orderId);
// console.log("userId:", userId);
    // 1. Find user's order
    const order = await Order.findOne({
        _id: orderId,
        user: userId
    });
    
    if (!order) {
        throw new AppError(404, "Order Does not Exist");
    }
   

    // 2. Validate order
    if (order.orderStatus === "cancelled") {
        throw new AppError(400, "Order is cancelled");
    }

    if (order.paymentStatus === "paid") {
        throw new AppError(400, "Order is already paid");
    }

    if (order.paymentMethod === "cod") {
        throw new AppError(
            400,
            "Payment will be done at the time of delivery"
        );
    }
   
     if(order.paymentDeadline &&  order.paymentDeadline.getTime() < Date.now()){
       
        throw new AppError(400 , "Payment Deadline is Over / Order is Cancelled");
     }
    // 3. Find existing Payment
    const existingPayment = await Payment.findOne({
        order: orderId,
        user: userId
    });

    // =====================================================
    // EXISTING PAYMENT
    // =====================================================

    if (existingPayment) {

        // Already paid
        if (existingPayment.status === "paid") {
            throw new AppError(
                400,
                "Payment is already completed"
            );
        }

     
        // Existing payment is still valid
        if (
            existingPayment.status === "pending" &&
            Date.now() < existingPayment.expiresAt.getTime() ) {
           
            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Existing payment can be resumed",
                    {
                        payment: existingPayment,

                        razorpayOrder: {
                            id: existingPayment.providerOrderId,
                            amount: existingPayment.amount * 100,
                            currency: existingPayment.currency
                        },

                        keyId: process.env.RAZORPAY_KEY_ID
                    }
                )
            );
        }

     // =================================================
        // EXISTING PAYMENT EXPIRED
         // =================================================
          if(existingPayment.attemptsUsed >= 5)throw new AppError(400 , "Max Attempt Reached / Try Creating Order Again ")
         
      
        
         const razorpayOrder = await razorpay.orders.create({

             // Payment amount is stored in rupees
             // Razorpay expects paise
             amount: existingPayment.amount * 100,

             currency: existingPayment.currency,

             receipt: order._id.toString()
         });
            existingPayment.attemptsUsed +=1;
         // Reuse SAME Payment document
         existingPayment.providerOrderId =
             razorpayOrder.id;

         existingPayment.status = "pending";

         existingPayment.expiresAt = new Date(
            Math.min(
             new Date(Date.now() + 15 * 60 * 1000).getTime(),
             order.paymentDeadline.getTime()
         ));

         existingPayment.providerPaymentId = null;

         await existingPayment.save();

         

        return res.status(200).json(
            new ApiResponse(
                200,
                "New payment attempt created",
                {
                    payment: existingPayment,

                    razorpayOrder: {
                        id: razorpayOrder.id,
                        amount: razorpayOrder.amount,
                        currency: razorpayOrder.currency
                    },

                    keyId: process.env.RAZORPAY_KEY_ID
                }
            )
        );
    }

    // =====================================================
    // NO PAYMENT EXISTS → FIRST PAYMENT ATTEMPT
    // =====================================================

    const razorpayOrder = await razorpay.orders.create({

        amount: order.totalAmount * 100,

        currency: "INR",

        receipt: order._id.toString()
    });

   
       

        const attempt  = 1;
    const payment = await Payment.create({

        order: orderId,

        user: userId,

        amount: order.totalAmount,

        currency: "INR",

        provider: "razorpay",

        providerOrderId: razorpayOrder.id,

        status: "pending",

        expiresAt: new Date(
            Math.min(
             new Date(Date.now() + 15 * 60 * 1000).getTime(),
             order.paymentDeadline.getTime()
         )),

        attemptsUsed : attempt
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            "Payment created successfully",
            {
                payment,

                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency
                },

                keyId: process.env.RAZORPAY_KEY_ID
            }
        )
    );
};


const verifyPayment = async(req , res)=>{
        const {orderId} = req.params;
        const userId = req.userId;

        const {razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature } = req.body;

            const session = await mongoose.startSession();

            try{
                 session.startTransaction();

                const order = await Order.findOne({
            _id: orderId,
            user:userId 
           
        }).session(session);
        if(!order)throw new AppError(404 , "Order DOes not Exist");

        const payment = await Payment.findOne({
            user : userId ,
            order :  orderId
        }).session(session);
        if(!payment)throw new AppError(404 ,"Payment does not exist");
         if(payment.status === "paid"){
      
            return res.status(200).json(new ApiResponse(200 , "Payment is Already Verified"));
        }
        if(payment.providerOrderId !== razorpay_order_id)throw new AppError(400 , "Order id does not matched");
        const generateSignature = crypto.createHmac('sha256' , process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${ razorpay_payment_id}`).digest('hex');

        if(razorpay_signature !== generateSignature)throw new AppError(400 , "Payment Verification Failed");

       
        payment.status = "paid" , 
        payment.providerPaymentId = razorpay_payment_id
        payment.providerOrderId = razorpay_order_id
        payment.expiresAt = undefined
        order.paymentStatus = "paid"
        await payment.save({session});
        await order.save({session});
       await session.commitTransaction();
        return res.status(200).json(new ApiResponce(200 , "Payment is Verified and Amount Paid Succesfully"  ,{payment , order}));
                
            }catch(err){
                await session.abortTransaction();
                throw err;
            }finally{
                await session.endSession()
            }
}
export {createPayment , verifyPayment};