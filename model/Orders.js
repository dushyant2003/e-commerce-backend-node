const mongoose = require("mongoose")

const OrderSchema = new mongoose.Schema({
    u_id:{
        type:String,
        required:true
    },
    ord_id:{
        type:String,
        required:true
    },
    o_data:{
        type:Array,
        required:true,
    }, 
    time:{
        type:Number,
        required:true
    },
    status:{
        type:Number,
        // 0 means pending 1 means dispatched 2 means delievered
        required:true
    },
    total:{
        type:Number,
        required:true
    }
}) 
const Order = mongoose.model("Order",OrderSchema)
module.exports = Order
