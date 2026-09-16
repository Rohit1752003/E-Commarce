import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import ApiResponse from "../utils/apiResponce.js";
import AppError from "../utils/apiError.js";
import Cart from "../models/cart.model.js";
import mongoose, { mongo } from "mongoose";
import product from "../routes/product.route.js";
const checkOut  = async(req  , res)=>{
    const {shippingAddress} = req.body
    const userId = req.userId
    const cart = await Cart.findOne({user : userId})
    if(!cart || cart.items.length === 0)return  res.status(200).json(new ApiResponse(200 , "Cart is empty / try to Add items in Cart"));
    const allItems = cart.items;

     
    for(const item of allItems){
         const product = await Product.findById(item.product);
         if(!product)throw new AppError(404 , "Product does not exist ")

        if(product.isActive !== true)throw new AppError(400 , " Product is no longer available")

        if(item.quantity > product.stock)throw new AppError(400 , `Required Quantity is not Available , stock: ${product.stock}`)
        
         
       
    }

  
     const orderSnapshot = []

     const session = await mongoose.startSession();
    try{
        session.startTransaction();

         for(const item of allItems){
             const product = await Product.findOneAndUpdate( {
                _id : item.product ,
                isActive : true,
                stock : {$gte : item.quantity} ,
             },
             {
                     $inc : {stock : -item.quantity}
             },
             {
                  new: true,
            runValidators: true
             }
            
            ).session(session)
            if(!product)throw new AppError(400 , "Product is unavailable during checkOut")

            const orderItem = {
            product : product._id,
            name : product.name,
            price : product.price,
            quantity:item.quantity,
            subtotal :  product.price * item.quantity,
        }

         orderSnapshot.push(orderItem)
    }
    let totalAmount =0 ; 
    for(const total of orderSnapshot){
        totalAmount += total.subtotal
    }
     const createOrder = await Order.create( [{
        user: userId,
        items: orderSnapshot,
        totalAmount,
        shippingAddress,
        orderStatus: "pending",
        paymentStatus: "pending"
    }],
    { session }
)
            
        cart.items = []
        await cart.save({session})
         await session.commitTransaction();
        return res.status(201).json(new ApiResponse(201 , "Order Created Succesfully" , createOrder))
    
}
    
    catch(err){
        await session.abortTransaction();
        throw err
    } 
    finally {
        await session.endSession();
    }
}
   
const getAllOrders = async(req , res)=>{
    const userId = req.userId
    const {sort , page , limit} = req.query
    const filter = {user : userId}
    const sortValue = sort || "createdAt";
    const sortDirection = sortValue.startsWith('-')? -1 : 1;
    const sortField = sortValue.startsWith('-')?sortValue.slice(1):sortValue
    const SortOption = {
        [sortField]:sortDirection
    }
  
    const skip = (page-1) * limit;
   
    const findOrder = await Order.find(filter).sort(SortOption).skip(skip).limit(limit)
    if (findOrder.length === 0) {
        return res.status(200).json(
            new ApiResponse(
                200,
                "No orders found",
                {
                    orders: [],
                    pagination: {
                        totalOrders: 0,
                        page ,
                        limit ,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                }
            )
        );
    }
    const totalOrders = await Order.countDocuments(filter);
        const totalPages =Math.ceil(totalOrders / limit);
    return res.status(200).json(new ApiResponse(200 , "Order Fetch Succesfully" , {findOrder , pagination :{
      totalOrders ,
            page , limit , 
            totalPages ,
           hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    }}))
}
const getOneOrder = async(req , res)=>{
    const {id} = req.params;
    const userId = req.userId
    const order = await Order.findById(id);
     if(!order)throw new AppError(404 , "Order Does not Exist");
     if(!order.user.equals(userId))throw new AppError(403 , "Forbidden Excess")
    return res.status(200).json(new ApiResponse(200 , "Order Fetch Succesfully" , order));
}
const canceledOrder = async(req , res)=>{
    const userId = req.userId
    const {id} = req.params
    const order = await Order.findOne({
        _id : id, 
        user : userId
    });
     if(!order)throw new AppError(404 , "Order Does not Exist");


     const session = await mongoose.startSession();
     if (
        order.orderStatus === "shipped" ||
        order.orderStatus === "delivered" ||
        order.orderStatus === "cancelled"||
        order.orderStatus === "processing"
    ) {
        throw new AppError(
            400,
            "Order cannot be cancelled at this stage"
        );
    }
     try{

         const allItems = order.items;
        
        session.startTransaction();

          for(const item of allItems){
             const product = await Product.findOneAndUpdate( {
                _id : item.product ,

             },
             {
                     $inc : {stock : +item.quantity}
             },
             {
                  new: true,
            runValidators: true
             }
             
            ).session(session)
              if (!product) {
                throw new AppError(
                    404,
                    `Product ${item.name} no longer exists`
                );
            }
        }

          order.orderStatus = "cancelled"
          await order.save({session});
            await session.commitTransaction();
            return res.status(200).json(new ApiResponse(200 , "Order Canceled Succesfully"))
        
}catch(err){
    await session.abortTransaction()
    throw err;
}
finally{
    await session.endSession()
}
}
export {checkOut  , getAllOrders , getOneOrder , canceledOrder} 