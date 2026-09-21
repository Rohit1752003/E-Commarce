import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user :{
        type : mongoose.Schema.Types.ObjectId,
        ref :  "User",
        required : true,
    },
    items :[
        {
             product :{
            type :mongoose.Schema.Types.ObjectId,
            ref : "Product",
            required : true, 
        },
        name : {
            type : String,
            required : true,

        } , 
        price:{
            type : Number,
            required : true,
            min : 0,
        },
        quantity : {
            type : Number ,
            required : true,
            min : 1,
        },
        subtotal : {
            type : Number ,
            required : true,
            min : 0,
            validate :{
                validator : function(value){
                    return value === this.price * this.quantity
                },
                message: "Subtotal must equal price × quantity"
            }

        }
    }  
    ],
    totalAmount : {
        type : Number, 
        required : true,
        min : 0 ,
        validate :{
            validator : function(value){
                const total = this.items.reduce((sum , item)=>
                    sum + item.subtotal , 0
                )
                return value === total
            },
            message : "Total Amout Does not match order Items"
        }

    },
   shippingAddress: {
    fullName:{
        type : String,
        required : true,
    } ,
    phone: {
        type : String,
        required : true,
    } ,
    addressLine:{
        type : String,
        required : true,
    } ,
    city: {
        type : String,
        required : true,
    } ,
    state: {
        type : String,
        required : true,
    } ,
    postalCode: {
        type : String,
        required : true,
    } ,
    country: {
        type : String,
        required : true,
    } ,
},
    orderStatus :{
        type : String ,
        enum : ["pending", "confirmed", "processing", "shipped",  "delivered" ,"cancelled"],
        default : "pending",
    },
    paymentStatus :{
        type : String , 
        enum : ["pending" , "paid" ,"failed" , "refunded"],
        default : "pending"
    }

}, {timestamps : true})
const Order = mongoose.model("Order" , orderSchema)
export default Order