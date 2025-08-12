import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// access and refresh token generater  of login user=>

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating referesh and access token"
        );
    }
};

//1 Register User---->

const registerUser = asyncHandler(async (req, res) => {
    //     res.status(600).json({
    //         message:"ok chai aur code 8000"
    //     })

    //   Steps---->
    //   1 get user details form frontened (we can get from postman)
    //   2 validation -- not empty
    //   3 check if user already exsist: username and email
    //   4 check for images and avatar
    //   5 upload them cloudinary
    //   6 create user object - create entry in db
    //   7 remove password and refesh token field from response
    //   8 check for user creation
    //   9 return response
    //   10 create user object - create entry in db

    //   taking steps----->

    //   get data from user=>

    const { fullName, email, username, password } = req.body;
    console.log("all data recived through req.body=>", req.body);
    console.log("email:", email);
    console.log("username:", username);

    // validation of data=>

    // if(fullName === ""){
    //   throw new ApiError(400,"full name is required")
    //  }

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required");
    }

    // check for exsisting user=>

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // image handling of  data=>

    console.log(" ALL FILES RECEIVED --->", req.files); // this gives all the files recived✅

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("Avatar Local Path --->", avatarLocalPath); // will confirm if it's undefined

    //   const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //   console.log("coverImage Local Path --->", coverImageLocalPath);  // will confirm if it's undefined

    //If in case coverImage is not provided-->
    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
        console.log("coverImage Local Path --->", coverImageLocalPath);
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is reequired");
    }

    // Upload on cloudinary=>

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Response object from Cloudinary ", avatar);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Create a user object and enter in datbase=>

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "user registeres Sucessfull"));
});

//2 Login User --->

const loginUser = asyncHandler(async (req, res) => {
    //Steps ---->

    //req body --->data
    //username or email
    //find the user
    //password check
    //access and refresh token

    //1 req data=>
    const { email, username, password } = req.body;
    console.log(email);

    //2 username or email=>
    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")

    // }

    //3 find the user=>
    const user = await User.findOne({
        //user kai andar refresh token abhi empty hai
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    //4 password check=>
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    //5 access and refresh token=>
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
        user._id
    );

    //6 send cookie

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true, // now cookie can be modified only through server
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken, // data  field
                    refreshToken,
                },
                "user logged in successfully"
            )
        );
});

//3 Logout user ---->

const logoutUser = asyncHandler(async (req, res) => {
    // req.user._id (add the user id to the response as an object)

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
});

//4 Endpoint to hit api and refresh refreshToken--->

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    try {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        // match 2 Tokens 

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "RefreshToken is expires or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }


        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(
            user._id
        );

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access Token refresh  successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")

    }
})


export { registerUser, loginUser, logoutUser, refreshAccessToken};
