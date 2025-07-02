import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try{
        const connectuionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDb connected !! DB host ${connectuionInstance.connect.host}`); 
    }catch(error){
        console.log("MONGODB connection error:",error);
        process.exit(1)   // function contains in node.js
    }

}


export default connectDB;