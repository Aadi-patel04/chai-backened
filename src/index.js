// require ('dotenv').config({path: './env'})   valid but we want to use import syntax
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at the port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection fails");
  });

//1) Database connection Directly through index file ---->

/*import mongoose from "mongoose";
import express from "express"

const app=express()

// ()() immediately excuting function

;(async ()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("ERROR :",error)
        throw error
       })

       app.listen(process.env.PORT,()=>{
        console.log(`App is listning on port ${process.env.PORT}`)
       })
    }
    catch(error){
        console.log("ERROR:",error);
        throw error;
    }
}) ()*/
