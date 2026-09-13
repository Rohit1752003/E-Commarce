import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

import fs from 'fs';
 cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
 })
 const uploadOnCloudinary = async(localPath)=>{
     if (!localPath) return null;
    try{
       const response = await cloudinary.uploader.upload(localPath);

        fs.unlinkSync(localPath);

        return response;

    }catch(err){
      if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
      
          throw err;
        
    }
 }
 const deleteOnCloudinary = async(publicId)=>{
    if(!publicId)return null
    try{
        await cloudinary.uploader.destroy(publicId)
        console.log('File deleted successfully from Cloudinary');
    }catch(err){
        throw err
    }
 }
 export {uploadOnCloudinary , deleteOnCloudinary}