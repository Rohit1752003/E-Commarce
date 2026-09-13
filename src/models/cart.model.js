import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    items :[
        {
            product:{
                type : mongoose.Schema.Types.ObjectId,
                ref : "Product",
                required : true,
            },
            quantity:{
                type : Number , 
                required : true,
                min : 1
            }
        }
    ]
} , {
    timestamps : true
})
cartSchema.index({ user: 1 }, { unique: true });

const Cart =  mongoose.model("Cart" , cartSchema)
export default Cart