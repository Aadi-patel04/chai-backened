import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

//access and refresh token generation 
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

//1 Register User --->

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

    //If in case coverImage is not provided
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

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registeres Sucessfull")
    )

})

//2 Login User --->

const loginUser = asyncHandler(async (req, res) =>{
    //Steps ---->

    //req body --->data
    //username or email
    //find the user
    //password check 
    //access and refresh token 

    //1 req data
    const {email, username, password} = req.body
    console.log(email);

    //2 username or email
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    //3 find the user 
    const user = await User.findOne({   //user kai andar refresh token abhi empty hai 
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    //4 password check
   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

    //5 access and refresh token 
    const {accessToken ,refreshToken} = await generateAccessAndRefereshTokens(user._id)

    //6 send cookie

    const loggedInUser = await User.findById(user._id).select
    ("-password -refreshToken");

    const options ={
        httpOnly:true,
        secure :true    // now cookie can be modified only through server 
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options )
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, accessToken,   // data  field 
                refreshToken
            },
            "user logged in successfully"
        )
    )



})

//3 Logout user ---->

const logoutUser = asyncHandler(async (req,res)=>{
    // req.user._id

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        }
    )

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json( new ApiResponse(200,{},"User Logout successfully"))
})

export {registerUser,
    loginUser,
    logoutUser
} 