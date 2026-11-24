import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            trim: true
        },

        provider: {
            type: String,
            required: true,
            enum: ["razorpay"],
            default: "razorpay"
        },

        eventType: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["processing", "processed"],
            default: "processing",
            required: true
        },

        processedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same provider event from being processed twice.
webhookEventSchema.index(
    { provider: 1, eventId: 1 },
    { unique: true }
);

const WebhookEvent = mongoose.model(
    "WebhookEvent",
    webhookEventSchema
);

export default WebhookEvent;