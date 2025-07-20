import { v2 as cloudinary } from 'cloudinary'

import {fs} from 'fs'

cloudinary.config({ 
  cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME', 
  api_key: 'process.env.CLOUDINARY_API_KEY', 
  api_secret: 'process.env.CLOUDINARY_API-SECRET'
});


const uploadOnCloudinary = async (loaclFilePath)=>{
    try {
        if(!loaclFilePath) return null
        //Upload the file on cloudinary

        const response = await cloudinary.uploader.upload(localStorage,{
            resource_type:"auto"
        })

        //file has been uploaded successfully
        console.log("File is uploaded on clooudinary",response.url) //upload hone kai baad url 
        return response
    } catch (error) {
        fs.unlinkSync(loaclFilePath) //remove the locally saved temproray file as upload operation got failed 
        return null;
    }
}

export {uploadOnCloudinary}

//simple image upload

// cloudinary.uploader
//   .upload("my_image.jpg")
//   .then(result=>console.log(result));