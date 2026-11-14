import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import AppError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponce.js";
import User from "../models/user.model.js";
import razorpay from "../config/razorPay.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import PaymentAttempt from "../models/payment_Attempt.model.js";
import crypto from "crypto";
import { AsyncResource } from "async_hooks";

// -----------
//           //
// -----------
const acquirePaymentLock = async (payment, order, userId) => {

    const lockToken = crypto.randomBytes(32).toString("hex");

    const now = new Date();

    const lockDuration = 60 * 1000;

    const lockUntil = new Date(
        now.getTime() + lockDuration
    );

    const lockedPayment = await Payment.findOneAndUpdate(
        {
            _id: payment._id,
            order: order._id,
            user: userId,
            status: "pending",

            $or: [
                { attemptCreationLockUntil: null },
                { attemptCreationLockUntil: { $lte: now } }
            ]
        },
        {
            $set: {
                attemptCreationToken: lockToken,
                attemptCreationLockUntil: lockUntil
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!lockedPayment) {
        throw new AppError(
            409,
            "Payment is currently being processed. Please try again."
        );
    }

    return {
        lockedPayment,
        lockToken
    };
};

// -----------
//           //
// ----------- 

const releasePaymentLock = async (paymentId, lockToken) => {
    await Payment.updateOne(
        {
            _id: paymentId,
            attemptCreationToken: lockToken
        },
        {
            $set: {
                attemptCreationToken: null,
                attemptCreationLockUntil: null
            }
        }
    );
};
// -----------
//           //
// -----------

const renewPaymentLock = async (paymentId, lockToken) => {
    const now = new Date();

    const lockDuration = 60 * 1000;

    const newLockUntil = new Date(
        now.getTime() + lockDuration
    );

    const result = await Payment.updateOne(
        {
            _id: paymentId,
            status: "pending",
            attemptCreationToken: lockToken,
            attemptCreationLockUntil: { $gt: now }
        },
        {
            $set: {
                attemptCreationLockUntil: newLockUntil
            }
        }
    );

    if (result.modifiedCount !== 1) {
        throw new AppError(
            409,
            "Payment lock expired or ownership was lost."
        );
    }

    return true;
};

// -----------
//           //
// -----------

const startPaymentLockHeartbeat = (
    paymentId,
    lockToken
) => {
    const RENEW_INTERVAL = 20 * 1000;

    let stopped = false;
    let lockLost = false;
    let renewalInProgress = false;

    const timer = setInterval(async () => {

        if (stopped || lockLost || renewalInProgress) {
            return;
        }

        renewalInProgress = true;

        try {
            await renewPaymentLock(paymentId, lockToken);
        } catch (error) {
            lockLost = true;

            console.error(
                "Payment lock renewal failed:",
                error
            );
        } finally {
            renewalInProgress = false;
        }

    }, RENEW_INTERVAL);

    return {
        stop: () => {
            stopped = true;
            clearInterval(timer);
        },

        assertLockOwned: async () => {
            if (lockLost) {
                throw new AppError(
                    409,
                    "Payment lock ownership was lost."
                );
            }

            await verifyPaymentLock(paymentId, lockToken);
        }
    };
};

// -----------
//           //
// -----------
const verifyPaymentLock = async (paymentId, lockToken) => {
    const now = new Date();

    const lockedPayment = await Payment.findOne({
        _id: paymentId,
        status: "pending",
        attemptCreationToken: lockToken,
        attemptCreationLockUntil: { $gt: now }
    }).select("_id");

    if (!lockedPayment) {
        throw new AppError(
            409,
            "Payment lock expired or ownership was lost. Please retry."
        );
    }

    return true;
};

// -----------
//           //
// -----------
const createNewPaymentAttempt = async (order, payment, userId  , heartbeat ) => {

    // 1. Convert rupees to paise
    const amountPaise = Math.round(
        Number(order.totalAmount) * 100
    );

    if (
        !Number.isSafeInteger(amountPaise) ||
        amountPaise <= 0
    ) {
        throw new AppError(400, "Invalid payment amount");
    }

    // 2. Calculate expiry
    const paymentExpiresAt = new Date(
        Math.min(
            Date.now() + 15 * 60 * 1000,
            order.paymentDeadline.getTime()
        )
    );

    if (paymentExpiresAt.getTime() <= Date.now()) {
        throw new AppError(400, "Payment deadline has expired");
    }

    await heartbeat.assertLockOwned();


    // 3. Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: order._id.toString()
    });
 
    
await heartbeat.assertLockOwned();
    // 4. Save PaymentAttempt
    const paymentAttempt = await PaymentAttempt.create({
        order: order._id,
        payment: payment._id,
        user: userId,
        provider: "razorpay",
        providerOrderId: razorpayOrder.id,
        amountPaise: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        status: "created",
        expiresAt: paymentExpiresAt,
     
    });

    return {
        paymentAttempt,
        razorpayOrder
    };
};

// -----------
//           //
// -----------
const toPublicPayment = (payment) => ({
    _id: payment._id,
    order: payment.order,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status
});

// -----------
//           //
// -----------
const toPublicAttempt = (attempt) => ({
    _id: attempt._id,
    payment: attempt.payment,
    order: attempt.order,
    provider: attempt.provider,
    providerOrderId: attempt.providerOrderId,
    amountPaise: attempt.amountPaise,
    currency: attempt.currency,
    status: attempt.status,
    expiresAt: attempt.expiresAt,
    createdAt: attempt.createdAt
});


// Attemp Checking
const checkPaymentAttempt = async (payment, userId , order) => {

        
    const MAX_PAYMENT_ATTEMPTS = 4;

const attemptsUsed = await PaymentAttempt.countDocuments({
    payment: payment._id,
    user : userId,
    order : order._id       
});

if (attemptsUsed >= MAX_PAYMENT_ATTEMPTS) {
    throw new AppError(
        400,
        "Maximum payment attempts reached. Please create a new order."
    );
}
return {attemptsUsed}
}


// -----------
//           //
// -----------
const createPayment = async (req, res) => {
    const { orderId } = req.body;
    const userId = req.userId;

    // -----------------------------------------
    // BLOCK 1: Validate request
    // -----------------------------------------

    if (!orderId) {
        throw new AppError(400, "Order ID is required");
    }
    if (!mongoose.isObjectIdOrHexString(orderId)) {
    throw new AppError(400, "Invalid order ID");
}
    // -----------------------------------------
    // BLOCK 2: Fetch and validate Order
    // -----------------------------------------

    const order = await Order.findOne({
        _id: orderId,
        user: userId
    });

    if (!order) {
        throw new AppError(404, "Order does not exist");
    }

    if (["cancelled", "expired"].includes(order.orderStatus)) {
        throw new AppError(400, "Order is no longer active");
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

    if (
        !order.paymentDeadline ||
        order.paymentDeadline.getTime() <= Date.now()
    ) {
        throw new AppError(400, "Payment deadline has expired");
    }

    // -----------------------------------------
    // BLOCK 3: Find or create parent Payment
    // -----------------------------------------

    let payment = await Payment.findOne({
        order: order._id,
        user: userId
    });

    if (!payment) {
        try {
            payment = await Payment.create({
                order: order._id,
                user: userId,
                amount: order.totalAmount,
                currency: "INR",
                provider: "razorpay",
                status: "pending"
            });
        } catch (error) {
            // Another request may have created it first.
            if (error.code !== 11000) {
                throw error;
            }

            payment = await Payment.findOne({
                order: order._id,
                user: userId
            });

            if (!payment) {
                throw error;
            }
        }
    }

    if (payment.status !== "pending") {
        throw new AppError(
            409,
            `Payment cannot be initiated. Current status: ${payment.status}`
        );
    }


    // -----------------------------------------
    // BLOCK 4: Acquire Payment lock
    // -----------------------------------------
    const { lockedPayment, lockToken } =
    await acquirePaymentLock(payment, order, userId);
    
    const heartbeat = startPaymentLockHeartbeat(
    lockedPayment._id,
    lockToken
);
    try {
        
       
         await heartbeat.assertLockOwned();
    // -----------------------------------------
    // INTERMEDIATE: Ensure order remained under deadline and its valid 
    // -----------------------------------------
    const freshOrder = await Order.findOne({
    _id: order._id,
    user: userId
});

if (!freshOrder) {
    throw new AppError(404, "Order does not exist");
}

if (["cancelled", "expired"].includes(freshOrder.orderStatus)) {
    throw new AppError(400, "Order is no longer active");
}

if (freshOrder.paymentStatus === "paid") {
    throw new AppError(409, "Order is already paid");
}

if (freshOrder.paymentMethod === "cod") {
    throw new AppError(400, "COD orders cannot use online payment");
}

if (
    !freshOrder.paymentDeadline ||
    freshOrder.paymentDeadline.getTime() <= Date.now()
) {
    throw new AppError(400, "Payment deadline has expired");
}



// Validate parent Payment against latest Order

if (
    Number(lockedPayment.amount) !== Number(freshOrder.totalAmount) ||
    lockedPayment.currency !== "INR"
) {
    throw new AppError(
        409,
        "Payment amount does not match the order amount. Reconciliation required."
    );
}


       // -----------------------------------------
// BLOCK 5: Evaluate latest PaymentAttempt
// -----------------------------------------

const latestPaymentAttempt = await PaymentAttempt.findOne({
    payment: lockedPayment._id,
    order: freshOrder._id,
    user: userId
}).sort({ createdAt: -1 });

let shouldCreateNewAttempt = false;

// CASE 1: No previous attempt
if (!latestPaymentAttempt) {

    shouldCreateNewAttempt = true;
     const {attemptsUsed} = await checkPaymentAttempt(lockedPayment , userId , order)
}

// CASE 2: Previous attempt failed or expired
else if (
    ["failed", "expired"].includes(latestPaymentAttempt.status)
) {

    shouldCreateNewAttempt = true;
    const {attemptsUsed} = await checkPaymentAttempt(lockedPayment , userId , order)

}

// CASE 3: Previous attempt is created or pending
else if (
    ["created", "pending"].includes(latestPaymentAttempt.status)
) {

    if (
        !latestPaymentAttempt.providerOrderId ||
        !latestPaymentAttempt.expiresAt
    ) {
        throw new AppError(
            409,
            "Payment attempt requires reconciliation"
        );
    }

    const isAttemptValid =
        latestPaymentAttempt.expiresAt.getTime() > Date.now();

    if (isAttemptValid) {

        // Reuse existing attempt
        return res.status(200).json(
            new ApiResponse(
                200,
                "Existing payment attempt can be resumed",
                {
                    payment: toPublicPayment(lockedPayment),
                    paymentAttempt: toPublicAttempt(latestPaymentAttempt),
                    razorpayOrder: {
                        id: latestPaymentAttempt.providerOrderId,
                        amount: latestPaymentAttempt.amountPaise,
                        currency: latestPaymentAttempt.currency
                    },
                    keyId: process.env.RAZORPAY_KEY_ID
                }
            )
        );

    } else {

        // Mark previous attempt as expired
        const expired = await PaymentAttempt.updateOne(
            {
                _id: latestPaymentAttempt._id,
                payment: lockedPayment._id,
                order: freshOrder._id,
                user: userId,
                status: { $in: ["created", "pending"] }
            },
            {
                $set: {
                    status: "expired",
                    failureReason: "Payment attempt expired"
                }
            }
        );

        if (expired.modifiedCount === 0) {
            throw new AppError(
                409,
                "Payment attempt requires reconciliation"
            );
        }

        shouldCreateNewAttempt = true;
         const {attemptsUsed} = await checkPaymentAttempt(lockedPayment , userId , order)
    }
}

// CASE 4: Authorized, captured or unexpected status
else {

    throw new AppError(
        409,
        "Payment attempt requires reconciliation before retrying"
    );
}


// -----------------------------------------
// BLOCK 6 & 7: Create new PaymentAttempt
// -----------------------------------------

if (shouldCreateNewAttempt) {

    const { paymentAttempt, razorpayOrder } =
        await createNewPaymentAttempt(
            freshOrder,
            lockedPayment,
            userId,
             heartbeat
        );
     

    return res.status(201).json(
        new ApiResponse(
            201,
            "New payment attempt created",
            {
                payment: toPublicPayment(lockedPayment),
                paymentAttempt: toPublicAttempt(paymentAttempt),
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
    } finally {

        // -----------------------------------------
        // BLOCK 8: Release Payment lock
        // -----------------------------------------
        heartbeat.stop();
        

        await releasePaymentLock(
            lockedPayment._id,
            lockToken
        );
    }
};

const verifyRazorpaySignature = (
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new AppError(500, "Payment configuration error");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest();

  if (!/^[a-fA-F0-9]{64}$/.test(razorpay_signature)) {
    throw new AppError(400, "Invalid Payment Signature");
  }

  const receivedSignature = Buffer.from(
    razorpay_signature,
    "hex"
  );

  if (!crypto.timingSafeEqual(expectedSignature, receivedSignature)) {
    throw new AppError(400, "Payment Verification Failed");
  }

  return true;
};
const verifyRazorpayPayment = async (paymentAttempt, razorpayPaymentId) => {
  const razorpayPayment = await razorpay.payments.fetch(
    razorpayPaymentId
  );

  if (
    razorpayPayment.id !== razorpayPaymentId ||
    razorpayPayment.order_id !== paymentAttempt.providerOrderId
  ) {
    throw new AppError(400, "Razorpay Payment Details Mismatch");
  }

  if (
    Number(razorpayPayment.amount) !==
      Number(paymentAttempt.amountPaise) ||
    razorpayPayment.currency !== paymentAttempt.currency
  ) {
    throw new AppError(400, "Payment Amount or Currency Mismatch");
  }

  if (razorpayPayment.status !== "captured") {
    throw new AppError(
      409,
      `Payment is not captured. Current status: ${razorpayPayment.status}`
    );
  }

  return razorpayPayment;
};
        
const verifyPayment = async(req , res)=>{
        // const {orderId} = req.params;
        const userId = req.userId;
        const {orderId} = req.body;
        const {razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature } = req.body;

        if( !userId || !mongoose.isObjectIdOrHexString(orderId))throw new AppError(400 , "Invalid Order Id");
        if(!razorpay_payment_id || !razorpay_order_id || !razorpay_signature)throw new AppError(400 , "Invalid Payment Verification Data");
        

         const order = await Order.findOne({
            _id: orderId,
            user:userId 
           
        })

        if(!order)throw new AppError(404 , "Order DOes not Exist");


        const payment = await Payment.findOne({
            user : userId ,
            order :  orderId
        })

        if(!payment)throw new AppError(404 ,"Payment does not exist");

       

        const paymentAttempt = await PaymentAttempt.findOne({
            payment : payment._id , 
            order : order._id ,
            user : userId ,
            providerOrderId : razorpay_order_id,         
        })

        if(!paymentAttempt)throw new AppError(404 , "Payment Attempt Does not Exist");  
        
          // Both already paid: idempotent success
        if (
        payment.status === "paid" && paymentAttempt.status === "paid" ) {
            if ( paymentAttempt.providerPaymentId !== razorpay_payment_id) {
            throw new AppError(409, "Payment ID mismatch. Reconciliation required.");
        }
        return res.status(200).json(
            new ApiResponse(200, "Payment is Already Verified")
        );
        }

        // Inconsistent state: reconciliation required
        if (
        payment.status === "paid" ||
        paymentAttempt.status === "paid"
        ) {
        throw new AppError(
            409,
            "Inconsistent Payment State. Reconciliation Required."
        );
        }


        
            verifyRazorpaySignature(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            );
             await verifyRazorpayPayment(paymentAttempt , razorpay_payment_id);
            const session = await mongoose.startSession();

            try{
                 session.startTransaction();
       
            
          const order = await Order.findOneAndUpdate({
                user : userId ,
                _id : orderId,
                paymentMethod : "online" ,
                paymentStatus : "pending" ,
            }, {
                $set: { paymentStatus: "paid"}  ,
                $unset : { deadline : 1 }
            }, {
                new: true
            }).session(session);
            
            if(!order)throw new AppError(404 , "Order Does not Exist");


            const payment = await Payment.findOneAndUpdate({
                _id : payment._id ,
                user : userId ,
                order :  orderId,
                status : "pending",
                provider : "razorpay",
                currency : "INR",

            }, {
                $set: { status: "paid" }
            }, {
                new: true
            }).session(session);

            if(!payment)throw new AppError(404 ,"Payment does not exist");


           const paymentAttempt = await PaymentAttempt.findOneAndUpdate({
                payment : payment._id , 
                order: orderId,
               status: { $in: ["created", "pending"] },
                providerOrderId : razorpay_order_id,         
            }, {
                $set: { status: "paid", providerPaymentId: razorpay_payment_id,},
                $unset: {  expiresAt: 1 }
            }, {
                new: true
            }).session(session);

            if(!paymentAttempt)throw new AppError(404 , "Payment Attempt Does not Exist");

       await session.commitTransaction();
        return res.status(200).json(new ApiResponse(200 , "Payment is Verified and Amount Paid Succesfully"  ,{payment , order}));
                
            }catch(err){
                 if (session.inTransaction()) {
                 await session.abortTransaction(); 
                }
            }finally{
                await session.endSession()
            }
}
export {createPayment , verifyPayment};