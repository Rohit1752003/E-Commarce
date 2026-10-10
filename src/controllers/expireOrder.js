
import ApiResponse from "../utils/apiResponce.js";

import expireOrderService from "../services/expireOrder.service.js";

const orderExpiration = async (req, res) => {
 
    const { orderId } = req.params;

    const result = await expireOrderService(orderId);
    return res.status(200).json(new ApiResponse(200 , "Order Expired" , result))
    
 
}
export default orderExpiration;