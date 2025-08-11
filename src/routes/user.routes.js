import { Router } from "express";
import { registerUser, loginUser, logoutUser} from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"    //multer middleware
import { verifyJWt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
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

router.route("/login").post(loginUser)
 

    //router.route("/login").post(login)  // https://localhost:8000/users/login

router.route("logout").post(verifyJWt, logoutUser)


export default router