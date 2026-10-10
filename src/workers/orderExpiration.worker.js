import Order from "../models/order.model.js";
import expireOrderService from "../services/expireOrder.service.js";

const worker = async()=>{

    const orders  = await Order.find({
        paymentMethod : "online",
        orderStatus : "pending",
        paymentDeadline : { $lte: new Date() },
        paymentStatus : "pending"
    })
    if( orders.length === 0)return;
    
    for(const order of orders){
        try{
             await expireOrderService(order._id);
        }catch(err){
            console.error(`Failed to expire order ${order._id}:`, err);
        }
      
    }
   
}
export default worker;