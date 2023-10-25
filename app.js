const express = require("express");
const app = express();
const mongoose= require("mongoose")
require('./db/conn')
app.use(express.json())
//const User = require('./model/userSchema')

app.use(require('./router/auth'))

app.get("/about", (req, res) => {
  res.send("Hello about from the server");
});
app.get("/contact", (req, res) => {
  res.send("Hello contact from the server");
});
app.get("/signin", (req, res) => {
  res.send("Hello Sign in from the server");
});
app.get("/signup", (req, res) => {
  res.send("Hello Sign up from the server");
});


app.listen(5000, () => {
  console.log("Server is running at port 5000");
});