

const allowedStatus ={
     pending: ["confirmed", "cancelled"],

    confirmed: ["processing", "cancelled"],

    processing: ["shipped"],

    shipped: ["delivered"],

    delivered: [],

    cancelled: []
        
}
const canTransition = (currentStatus , nextStatus)=>{
    if(allowedStatus[currentStatus].includes(nextStatus))return true;
    else return false;
}
export  {canTransition , allowedStatus}