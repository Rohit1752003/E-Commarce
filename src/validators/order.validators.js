import { z } from "zod";

const addressSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(3, "Full name must be at least 3 characters"),

    phone: z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),

    addressLine: z
        .string()
        .trim()
        .min(2, "Address must be at least 5 characters"),

    city: z
        .string()
        .trim()
        .min(2, "City is required"),

    state: z
        .string()
        .trim()
        .min(2, "State is required"),

    postalCode: z
        .string()
        .trim()
        .regex(/^[1-9][0-9]{5}$/, "Invalid Indian postal code"),

    country: z
        .string()
        .trim()
        .min(2, "Country is required")
});


const orderQuerySchema = z.object({
    search: z.string().optional(),
   status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
]).optional(),
    paymentStatus : z.enum([
        "pending" , "paid", "failed", "refunded"
    ]).optional(),
    page: z
        .coerce
        .number()
        .int()
        .positive()
        .default(1),

    limit: z
        .coerce
        .number()
        .int()
        .positive()
        .default(10),

    sort: z.string().optional(),
    fromDate : z.coerce.date().optional(),
      toDate : z.coerce.date().optional()  ,
       minAmount : z.coerce.number().min(1).optional() ,
        maxAmount : z.coerce.number().min(1).optional(),
});


const allowedStatusSchema = z.object({
    nextStatus: z.enum([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
    ])
});


export {
    addressSchema,
    orderQuerySchema,
    allowedStatusSchema
};