const mongoose = require("mongoose")
const otpSchema = new mongoose.Schema({
    time: {
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    otp:{
        type:String,
        required:true
    }
})
const OTP = mongoose.model("otp",otpSchema)
module.exports = OTP
