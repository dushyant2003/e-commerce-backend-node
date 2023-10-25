const mongoose = require("mongoose")
const productSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true,
        unique:true
    },
    price: {
        type:Number,
        required:true
    },
    discount: {
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    }
})
const Product = mongoose.model("product",productSchema)
module.exports = Product