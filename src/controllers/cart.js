import Cart from "../models/cart.model.js";
import AppError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponce.js";
import Product from "../models/product.model.js";


// Cart Creation
const addToCart = async(req , res)=>{
    const {productId , quantity} = req.body
    const userId = req.userId;
    const product = await Product.findById(productId)
    if(!product)throw new AppError(404 , "product Does not Exist")

    if(product.isActive !== true || product.stock === 0 )throw new AppError(409 , "Product is Out Of Stock")

    if( product.stock < quantity )throw new AppError(400 , `Quantity Exceed Stock Amount  ,  Stock : ${product.stock} `)
    const items = [
        {
            product:productId ,
           quantity: quantity
        }
    ]
      const cart = await Cart.findOne({ user: userId });
      if(!cart) {
        const createCart = await Cart.create({user :userId ,items });
    return res.status(201).json(new ApiResponse(201 , "Item Added to the Cart" , createCart))
      }


    const existingProd = cart.items.find((item)=>{
       return  item.product.toString() === productId
    })
    if(existingProd){
        const newQua  = existingProd.quantity + quantity
        if(newQua > product.stock){
             throw new AppError(
                400,
                `Quantity exceeds stock amount. Stock: ${product.stock}`
            );
            
        }
        existingProd.quantity  = newQua
    } else {
        cart.items.push({
            product: productId,
            quantity
        });
    }
  await cart.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            "Item added to cart",
            cart
        )
    );
        
    }

const getAllItemInCart = async(req , res)=>{
    const userId = req.userId
    const cart = await Cart.findOne({user : userId}).populate({
        path : "items.product",
        select :'-stock  -category  -images  -isActive '
    })
    if(!cart){
        return res.status(200).json(new ApiResponse(200 , "Cart is Empty / Cart is not Created"))
    }
    return res.status(200).json(new ApiResponse(200 , "All items Fetched SuccesFully" , cart))

}
const updateProductQuantity = async (req, res) => {
    const { newQuantity } = req.body;
    const userId = req.userId;
    const { id } = req.params;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        return res.status(200).json(
            new ApiResponse(
                200,
                "Cart is Empty / Cart is not Created"
            )
        );
    }

    const existingItem = cart.items.find(
        (item) => item.product.toString() === id
    );

    if (!existingItem) {
        throw new AppError(404, "Product does not exist in cart");
    }

    const product = await Product.findById(id);

    if (!product) {
        throw new AppError(404, "Product does not exist");
    }

    if (!product.isActive || product.stock === 0) {
        throw new AppError(409, "Product is Out Of Stock");
    }

    if (newQuantity > product.stock) {
        throw new AppError(
            400,
            `Quantity exceeds stock amount. Stock: ${product.stock}`
        );
    }

    existingItem.quantity = newQuantity;

    await cart.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            "Cart updated successfully",
            cart
        )
    );
};
const removeFromCart = async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        return res.status(200).json(
            new ApiResponse(
                200,
                "Cart is Empty / Cart is not Created"
            )
        );
    }

    const existingItem = cart.items.find(
        (item) => item.product.toString() === id
    );

    if (!existingItem) {
        throw new AppError(
            404,
            "Product does not exist in cart"
        );
    }

    cart.items = cart.items.filter(
        (item) => item.product.toString() !== id
    );

    await cart.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            "Product removed from cart",
            cart
        )
    );
};
const clearCart = async(req , res)=>{
    const userId = req.userId
    const cart = await Cart.findOne({user : userId})
    if(!cart){
        return res.status(200).json(
            new ApiResponse(
                200,
                "Cart is Empty / Cart is not Created"
            )
        );
    } 
    cart.items = []
    await cart.save();
    return res.status(200).json(new ApiResponse(200 , "Cart is Cleared"))
}
export  {addToCart ,  getAllItemInCart, updateProductQuantity , removeFromCart  , clearCart}

