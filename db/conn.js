const dotenv= require("dotenv")
const express = require("express");
const app = express();
const mongoose= require("mongoose")

dotenv.config({path:'./config.env'})

const DB = process.env.DATABASE;

mongoose.connect(DB,{
  useNewUrlParser: true,
  useUnifiedTopology:true,
  
})
.then(()=>{
  console.log("Connection successfull")
})
.catch((err)=>console.log(err))

