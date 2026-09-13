import Category from '../models/category.model.js'
import AppError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponce.js';
const createCategory = async(req , res)=>{
        const {name} = req.body

        const exist = await Category.findOne({name});
        if(exist)throw new AppError(409 , "Category Already Exist")
        const category = await Category.create({name});
        res.status(201).json(new ApiResponse(201 , "Category Created Succesfuuly", category));
}
const getAllCategory = async(req , res)=>{
    const {search  , page , limit , sort} = req.validatedQuery    
    const filter = {}
    if(search){
        filter.$or = [
            {
              name:{
               $regex: search,
                $options: 'i',
              }  
            }
        ]
    }
    const sortValue = sort || 'createdAt';
    const sortDirection = sortValue.startsWith('-') ?-1 :1;
    const sortField =  sortValue.startsWith('-')?sortValue.substring(1):sortValue
    const sortOption = {
        [sortField]:sortDirection
    }
    const skip = (page - 1)*limit;
    const getAll = await Category.find(filter).sort(sortOption).skip(skip).limit(limit)
    const totalCategory = await Category.countDocuments(filter);
    const totalPages =Math.ceil(totalCategory / limit);
    res.status(200).json(new ApiResponse(200 , "All category Fetched" , {
         getAll,
      pagination: {
        totalCategory,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }))

    
}
const getOneCategory = async (req , res)=>{
    const {id} = req.params;
    const find = await Category.findById(id);
    if(!find)throw new AppError(404 , "Category Does  not Exist");
    res.status(200).json(new ApiResponse(200 , "Single Category Fetched succesfully" , find));

}
const updateCategory = async(req , res)=>{
    const {id} = req.params;
    const {name , isActive} = req.body
    const category = await Category.findById(id);
       if(!category)throw new AppError(404 , "Category Does  not Exist");
       const updateData = {};

if (name !== undefined) {
    updateData.name = name;
}

if (isActive !== undefined) {
    updateData.isActive = isActive;
}
    const updateCat = await Category.findByIdAndUpdate(
        id ,updateData , {
         new: true,
      runValidators: true })
    res
      .status(200)
      .json(new ApiResponse(200, 'category Updated Successfully', updateCat));
}
const deactivateCategory = async (req, res)=>{
    const {id}= req.params ;
    const category = await Category.findById(id);
    if(!category)throw new AppError(401 , "Category Does  not Exist");
   
    category.isActive = false;
    await category.save()
    
    
    res.status(200).json(new ApiResponse(200 , "Category deleted Succesfully"))
}
export {createCategory , getAllCategory , getOneCategory , updateCategory , deactivateCategory}