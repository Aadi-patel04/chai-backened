const asyncHandler = (requestHandler) =>{
   return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}  

//1)Using Try_ Catch --->

// const asyncHandler = () =>{}
// const asyncHandler = (func) =>{ ()=>{}}
// const asyncHandler = (func) =>async()=>{}

/* const asyncHandler = (fn) =>async(req,res,next)=>{
        try {
            await fn(req,res,next)
        } catch (error) {
            res.status(error.code || 500).json({
                success:false,
                message:error.message
            })
        }
    } */

