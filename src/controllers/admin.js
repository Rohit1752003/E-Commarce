import Order from "../models/order.model.js";
import ApiResponse from "../utils/apiResponce.js";
import AppError from "../utils/apiError.js";
import {canTransition , allowedStatus} from "../utils/orderStatus.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";

const getAllOrdersByAdmin = async(req , res)=>{

    const {search , status ,sort , page , limit , paymentStatus , fromDate , toDate  , minAmount , maxAmount} = req.query
    const filter = {}
    const sortValue = sort || "createdAt";
    const sortDirection = sortValue.startsWith('-')? -1 : 1;
    const sortField = sortValue.startsWith('-')?sortValue.slice(1):sortValue
    const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "totalAmount",
    "orderStatus",
    "paymentStatus"
];

if (!allowedSortFields.includes(sortField)) {
    throw new AppError(400, "Invalid sort field");
}
    const SortOption = {
        [sortField]:sortDirection
    }
  if (status) {
    filter.orderStatus = status;
}
if(paymentStatus){
    filter.paymentStatus = paymentStatus
}
  if(search){
    filter.$or =[
        {
            "items.name" : {
                $regex : search,
                $options : 'i'
            }

        },
        {
            "shippingAddress.phone":{
                 $regex: search , 
                $options :'i'
            }
        }
    ]
  }
  if(minAmount || maxAmount){
    filter.totalAmount = {}
    if(minAmount ){
        filter.totalAmount.$gte = minAmount
        
    }
    if(maxAmount ){
        filter.totalAmount.$lte = maxAmount
        
    }
  }

  if(fromDate || toDate){
     filter.createdAt = {}
     if(fromDate){
        filter.createdAt.$gte = fromDate
        
     }
     if(toDate){
        filter.createdAt.$lte =toDate
     }
  }
  
    const skip = (page-1) * limit;
   
    const orders = await Order.find(filter).sort(SortOption).skip(skip).limit(limit)
    if (orders.length === 0) {
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
    return res.status(200).json(new ApiResponse(200 , "Order Fetch Succesfully" , {orders , pagination :{
      totalOrders ,
            page , limit , 
            totalPages ,
           hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    }}))
}

const updateStatus = async(req , res)=>{
    const {id} = req.params;
    const {nextStatus} = req.body;
     const session = await mongoose.startSession()
        
     try{
        session.startTransaction();


    const order = await Order.findById(id).session(session);
    if(!order)throw new AppError(404 , "Order does not Exist");


   const currentStatus = order.orderStatus;
   if(!canTransition(currentStatus  , nextStatus))throw new AppError(400 , `Order Cannot Jump Directly to ${nextStatus} , Available Jumps Are : ${allowedStatus[currentStatus]}`);
     
    const updatedOrder = await Order.findOneAndUpdate(
    {
        _id: id,
        orderStatus: currentStatus
    },
    {
        $set: {
            orderStatus: nextStatus
        }
    },
    {
        new: true,
        session
    }
)     
    if (!updatedOrder) {
    throw new AppError(
        409,
        "Order status was changed by another request"
    );
}

   if(nextStatus === "cancelled"){
     
        for(const item of order.items){
              const statusChange = await Product.findOneAndUpdate({
            _id : item.product
        },{
            $inc : {stock : item.quantity}
            
        },{
             new: true,
            runValidators: true
        }).session(session)
        if (!statusChange) {
    throw new AppError(404, "Product could not be restored");
}

   
   }
        }


    await session.commitTransaction();
   return res.status(200).json(new ApiResponse(200 , "Order Status Updated Succesfulyy" , {order : updatedOrder}))
  

    }catch(err){
        await session.abortTransaction()
        throw err;
    }
    finally{
        await session.endSession()
    }
  
}
export {getAllOrdersByAdmin , updateStatus}