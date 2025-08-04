import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res)=>{
    
    // res.status(600).json({
    //     message:"ok chai aur code"
    // })

    // Steps---->
    // get user details form frontened (we can get from postman)
    //validation -- not empty
    //check if user already exsist: username and email
    //check for images and avatar
    //upload them cloudinary 
    //create user object - create entry in db 
    //remove password and refesh token field from response
    //check for user creation
    //return response
    //create user object - create entry in db 

   
   const {fullName,email,username,password}  = req.body   //get data from the frontened
   console.log("email:",email)
   console.log("username:",username)

   //validation of data

   if(fullName === ""){
    throw new ApiError(400,"full name is required")
   }

if(
    [fullName,email,username,password].some((field)=>
    field?.trim() === "")
){
    throw new ApiError(400,"all fields are required")
}

// check for exsisting user
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //image handling of  data

    console.log("FILES RECEIVED --->", req.files);  // this gives all the files recived✅


    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("Local path of avatar (value of this ->req.files?.avatar[0]?.path);",avatarLocalPath)//local path of avatar

    console.log("Avatar Local Path --->", avatarLocalPath);  // will confirm if it's undefined

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // console.log("coverImage Local Path --->", coverImageLocalPath);  // will confirm if it's undefined

    //If coverImage is not provided
     let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is reequired")
    }

    //Upload on cloudinary

    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log(avatar)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   
    // Create a user object and enter in datbase

        const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })


    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    // return response 

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registeres Sucessfull")
    )

})

export {registerUser}