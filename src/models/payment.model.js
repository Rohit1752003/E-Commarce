import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        currency: {
            type: String,
            default: "INR"
        },

        provider: {
            type: String,
            required: true
        },

        providerPaymentId: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded",
               
            ],
            default: "pending"
        },
        recoveryStatus: {
            type: String,
            enum: [
                "not_required",
                "pending",
                "processing",
                "fulfilled",
                "refund_pending",
                "refunded",
                "failed"
            ],
            default: "not_required"
            },
            
        refundStatus: {
        type: String,
        enum: [
            "not_required",
            "pending",
            "processing",
            "processed",
            "failed"
        ],
        default: "not_required"
        },


        providerRefundId: {
            type: String,
            default: null
        },

        refundIdempotencyKey: {
            type: String,
            default: null
        },
        providerOrderId: {
            type: String,
            default: null,
            unique: true,
            sparse: true
},      
// payment.model.js
refundAttempt: { type: Number, default: 0 },
    expiresAt : {
        type : Date,
    },
    attemptsUsed :{
        type : Number ,
        default : 0
    }
    },
    {
        timestamps: true
    }
);
paymentSchema.index({ status: 1 });
const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
