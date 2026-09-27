import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import AppError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponce.js";
import User from "../models/user.model.js";
import razorpay from "../config/razorPay.js";
const createPayment = async(req , res)=>{
        const {orderId} = req.params;

        const userId = req.userId;
        const order  = await Order.findOne({
            _id : orderId,
            user : userId
        });
        if(!order)throw new ApiResponse(404 , "Order Does not Exist");
   

        if(order.orderStatus === "cancelled")throw new AppError(400 , "Order is cancelled");
        if (order.paymentStatus === "paid" ) {
        throw new AppError(400, "Order is already paid");
    }
    if(order.paymentMethod === "cod")throw new AppError(400 , "Payment will done at a time of delivery")


      
        const existingPayment = await Payment.findOne({order :orderId});
        if(existingPayment){
            return res.status(200).json(new ApiResponse(200 , "Payment Already Exist"))
        }
        const razorpayOrder = await razorpay.orders.create({
            amount : order.totalAmount * 100,
            currency: "INR",
             receipt: order._id.toString()
        })
        const payment = await Payment.create({
                order : orderId , 
                user : userId ,
                amount : order.totalAmount,
                currency : 'INR',    
                  provider: "razorpay",
                providerOrderId: razorpayOrder.id,
                status : "pending",
        })
          return res.status(201).json(
        new ApiResponse(
            201,
            "Payment created successfully",{
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
}


