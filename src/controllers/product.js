import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import AppError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponce.js";
import isAdmin from "../middleware/isAdmin.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { response } from "express";

const createProduct = async (req , res)=>{

        const {name ,description , price ,stock  , category } = req.body;

        const product  = await Product.findOne({name});
        if(product)throw new AppError(409 , "Product Already Exist")
        const categoryExist = await Category.findById(category);
        
        if (!categoryExist || categoryExist.isActive !==true) {
            throw new AppError(404, "Category Does not Exist");
        }
        const imgesUrls  = req.files || []
       if (imgesUrls.length === 0) {
    throw new AppError(400, "At least one image is required");
}
        let uploadResposes = []
        if(imgesUrls){
            try{
                 for(const img of imgesUrls ){
                 const responce = await uploadOnCloudinary(img.path)
                 uploadResposes.push(responce)

            }
            }catch(err){
                    for(const id of uploadResposes)
                    await deleteOnCloudinary(id.public_id)
                throw new AppError(500 , "upload Failed")
            }
           
        }
        if(uploadResposes){
            try{
              const images = uploadResposes.map((image) => ({
                url: image.secure_url,
                publicId: image.public_id
            }));
            const create = await Product.create({
            name , description , price , stock , category , images
        })
        res.status(201).json(new ApiResponse(201 ,"Product Created Succesfully" , create ))
            }catch(err){
                 for(const id of uploadResposes)
                    await deleteOnCloudinary(id.public_id)
                  throw err
            }
           
        }
       
}
const getAllProduct =  async (req , res)=>{
    const {sort , search , page , limit } = req.query;
    const filter = {isActive : true}
   const sortValue = sort || 'createdAt';
    const sortDirection = sortValue.startsWith('-') ?-1 :1;
    const sortField =  sortValue.startsWith('-')?sortValue.substring(1):sortValue
    const sortOption = {
        [sortField]:sortDirection
    }
    if(search){
        filter.$or= [{
            
                name:{
                    $regex : search,
                     $options : 'i',
                    },
                },
                {
                description:{
                    $regex :search , 
                     $options: 'i'
                }

            
        }]
    }
      const skip = (page - 1)*limit;
      
        const totalProduct = await Product.countDocuments(filter);
        const totalPages =Math.ceil(totalProduct / limit);
    const product = await Product.find(filter).sort(sortOption).skip(skip).limit(limit)
    res.status(200).json(new ApiResponse(200  , "Product Fetched Succesfully" , {
        product , pagination :{
            totalProduct ,
            page , limit , 
            totalPages ,
           hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        }
    }))
}
const getOneProduct  = async (req , res)=>{
    const {id} = req.params;
    const product = await Product.findById(id).populate('category')
    if(!product)throw new AppError(404 , "Product Does not Exist")
    res.status(200).json(new ApiResponse(200 , "Product Fetch Succesfully" , product))
}
const updateProduct = async(req , res)=>{
    const {id} = req.params;
    const product = await Product.findById(id)
    if(!product)throw new AppError(404 , "Product Does not Exist");
    const {name , price , stock , category , description , isActive}= req.body;
    const updateData = {}
     if (name !== undefined) {
        updateData.name = name;
    }

    if (description !== undefined) {
        updateData.description = description;
    }

    if (price !== undefined) {
        updateData.price = price;
    }

    if (stock !== undefined) {
        updateData.stock = stock;
    }

    if (isActive !== undefined) {
        updateData.isActive = isActive;
    }

    if(category !== undefined){
        const existCategory = await Category.findOne({
            _id:category ,
            isActive : true
        })
        if (!existCategory) {
            throw new AppError(404, "Category Does not Exist or is Inactive");
        }

        updateData.category = category;
    }
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true
        }
    ).populate("category");

    return res.status(200).json(
        new ApiResponse(
            200,
            "Product Updated Successfully",
            updatedProduct
        ))
   
}

const deleteProduct = async(req , res)=>{
    const {id} = req.params;
    const product = await Product.findById(id)
    if(!product)throw new AppError(404 , "Product Does not Exist");
    product.isActive = false;
    product.stock = 0;
   await  product.save()
    res.status(200).json(new ApiResponse(200 ,"Product Deactivated Succesfully "))
}
const upadteProductImg = async(req, res)=>{
    const imgesUrls = req.files ;
    const {id} = req.params;
    const find = await Product.findById(id)
    if(!find)throw new AppError(404 , "Product Does not Exist")
   let uploadResposes = []
   if(!imgesUrls || imgesUrls.length === 0)throw new AppError(400 , "Please Provide at Least one Img")
        if(imgesUrls){
            try{
                 for(const img of imgesUrls ){
                 const responce = await uploadOnCloudinary(img.path)
                 uploadResposes.push(responce)

            }
            }catch(err){
                    for(const id of uploadResposes)
                    await deleteOnCloudinary(id.public_id)
                throw new AppError(500 , "upload Failed")
            }
           
        }
            try{
                const images = [
                ...find.images,
                ...uploadResposes.map((image) => ({
                url: image.secure_url,
                publicId: image.public_id
            }))
            ];
            const updateImg = await Product.findByIdAndUpdate(id , {
          images
        } ,  {
            new: true,
            runValidators: true
        }).populate('category')
        res.status(201).json(new ApiResponse(201 ,"Product Imges Updated  Succesfully" , updateImg ))
            }catch(err){
                 for(const id of uploadResposes)
                    await deleteOnCloudinary(id.public_id)
                throw new AppError(500 , "Cannot be uploaded")
                
            }
            
        


}
const removeImgOnUpdate = async (req, res) => {
    const { id } = req.params;
    const { publicId: publicIds = [] } = req.body;

    const product = await Product.findById(id);

    if (!product) {
        throw new AppError(404, "Product Does not Exist");
    }

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
        throw new AppError(400, "Please provide image publicId");
    }

    // Check that every requested image belongs to this product
    for (const publicId of publicIds) {
        const imageExists = product.images.some(
            (image) => image.publicId === publicId
        );

        if (!imageExists) {
            throw new AppError(
                400,
                `Image ${publicId} does not belong to this product`
            );
        }
    }

    try {
        // Delete from Cloudinary
        for (const publicId of publicIds) {
         await deleteOnCloudinary(publicId);
           
            
        }
    }
        catch(err){
            throw new AppError(500 , "Imges Cannot be Deleted / Imeges Deletion Failed")
        }
        try{

        // Remove images from MongoDB
        product.images = product.images.filter(
            (image) => !publicIds.includes(image.publicId)
        );

        await product.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                "Images deleted successfully",
                product
            )
        );

    } catch (err) {
        
        throw new AppError(500, "Failed to delete photos");
    }

};
export {createProduct  , getAllProduct , getOneProduct,deleteProduct , updateProduct  ,upadteProductImg  , removeImgOnUpdate }