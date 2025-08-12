import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"    //multer middleware
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([            //multer midlleware upload
        {
            name: "avatar",
            maxCount: 1                   
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

//Login Router

router.route("/login").post(loginUser)

    //router.route("/login").post(login)  // https://localhost:8000/users/login

//secured route

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)



export default router