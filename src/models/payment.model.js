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
                "refunded"
            ],
            default: "pending"
        },
        providerOrderId: {
        type: String,
        default: null,
        unique: true,
        sparse: true
},
    },
    {
        timestamps: true
    }
);
paymentSchema.index({ status: 1 });
const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;