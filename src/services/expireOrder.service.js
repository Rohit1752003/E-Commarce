import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import AppError from "../utils/apiError.js";
import mongoose from "mongoose";

const expireOrderService = async (orderId) => {
 
    
    const session = await mongoose.startSession();

    try{
        session.startTransaction();

          const order = await Order.findOneAndUpdate({
            paymentMethod : "online",
            _id : orderId,
            orderStatus : "pending",
            paymentDeadline : { $lte: new Date() },
            paymentStatus : "pending"
    } , {
        $set : { orderStatus : "expired" , paymentStatus : "failed"}
    },{ returnDocument: 'after' }).session(session);
    if(!order)throw new AppError(404 , "No Order Found to Expire")

    const payment = await Payment.findOneAndUpdate({
        order : orderId,
        status : "pending",
    } , {
        $set : { status : "failed"}
    },{ returnDocument: 'after' }).session(session);
    if(!payment)throw new AppError(404 , "No Payment Found to Expire")
    
    const allItems = order.items;
    for(const item of allItems){
        const product = await Product.findOneAndUpdate({
            _id : item.product,
        } , {
            $inc : { stock : item.quantity}
        },{ returnDocument: 'after' }).session(session);
        if(!product)throw new AppError(404 , "Product Not Found to Update Stock")
    }
    
    await session.commitTransaction();
    return {order , payment}
    
    }catch(err){   
        if(session.inTransaction()){
            await session.abortTransaction();
        } 
        throw err;
    }
    finally{
        await session.endSession();
    }
    
}
export default expireOrderService;