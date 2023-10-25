const express = require("express");
const dotenv= require("dotenv")
const router = express.Router();
const bcrypt = require("bcryptjs");
dotenv.config({path:'./config.env'})
// sending mail
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

require("../db/conn");
const User = require("../model/userSchema");
const OTP = require("../model/otp");
const Product = require("../model/productSchema");
const Cart = require("../model/Cart");
const Order = require("../model/Orders")

router.get("/", (req, res) => {
  res.send("Hello world from the server");
});

router.post("/register", async (req, res) => {
  const { name, email, phone, work, password, cpassword } = req.body;

  if (!name || !email || !phone || !work || !password || !cpassword) {
    return res.status(422).json({ error: "PLz fill all fields correctly" });
  }
  try {
    const userExist = await User.findOne({ email: email });
    if (userExist) {
      return res.status(422).json({ error: "Email already exists" });
    } else if (password !== cpassword) {
      return res.status(422).json({ error: "Password do not match" });
    }
    const user = new User({ name, email, phone, work, password, cpassword });

    await user.save();
    
    transporter
      .sendMail({
        from: '"Node" <dushyantbansal20003@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Hello", // Subject line
        text: `Welcome  ${name} You are Successfully Registered Thanks`, // plain text body
        // html body
      })
      .then((m_res) => {
        res.status(201).json({ message: "user registered successfully" });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    
  }
});

// login route
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Plz filled all details" });
    }
    const userLogin = await User.findOne({ email: email });
    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);

      if (!isMatch) {
        res.status(400).json({ error: "User errror" });
      } else {
        res.json({ message: "user Sign In Successfully" });
      }
    } else {
      res.status(400).json({ error: "Bad Credentials" });
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/sendOTP", (req, res) => {
  const { email } = req.body;
  var otp = Math.floor(Math.random() * 86552)
    .toString()
    .padStart(6, 0);

  OTP.deleteOne({ email: email })
    .then((d1) => {
      User.find({ email: email })
        .then((r1) => {
          if (r1.length > 0) {
            OTP.insertMany({
              time: Number(new Date()),
              email: r1[0].email,
              otp: otp,
            })
              .then((r2) => {
                if (r2.length > 0) {
                  transporter
                    .sendMail({
                      from: '"Node" <dushyantbansal20003@gmail.com>', // sender address
                      to: email, // list of receivers
                      subject: "Password Reset", // Subject line
                      text: `Hello ${r1[0].name}`, // plain text body
                      html: `<h3>Your 6 digit OTP to reset your password is: ${otp}</h3>`,
                    })
                    .then((m_res) => {
                      res
                        .status(200)
                        .json({ message: "OTP sent successfully" });
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                } else {
                  res
                    .status(400)
                    .send({ status: 400, message: "Something went wrong1" });
                }
              })
              .catch((err) => {
                res
                  .status(500)
                  .send({ status: 500, message: "Something went wrong2" });
              });
          } else {
            res
              .status(400)
              .send({ status: 400, message: "You are not a registered user" });
          }
        })
        .catch((err) => {
          res
            .status(500)
            .send({ status: 500, message: "Something went wrong3" });
        });
    })
    .catch((err) => {
      res.status(500).send({ status: 500, message: "Something went wrong3" });
    });
});

router.post("/changePassword", (req, res) => {
  const { email, otp, new_pass } = req.body;

  User.find({ email: email })
    .then((r1) => {
      if (r1.length > 0) {
        OTP.find({ email: email })
          .then((r2) => {
            if (r2.length > 0) {
              if (r2[0].otp == otp) {
                let t = Number(new Date());
                let tmp = (t - Number(r2[0].time)) / 1000;
                if (tmp > 300) {
                  res.status(400).send({ status: 400, message: "OTP expired" });
                } else {
                  bcrypt.genSalt(10, function (err, salt) {
                    if (err) {
                      res
                        .status(500)
                        .send({
                          status: 500,
                          message: "Something went wrong1",
                        });
                    } else {
                      bcrypt.hash(new_pass, salt, function (err, hash) {
                        if (err) {
                          res.status(500).send({
                            status: 500,
                            message: "Something went wrong2",
                          });
                        } else {
                          User.updateOne(
                            { email: email },
                            { $set: { password: hash } }
                          )
                            .then((r3) => {
                              if (r3.modifiedCount == 1) {
                                OTP.deleteOne({ email: email }).then((r4) => {
                                  if (r4.deletedCount == 1) {
                                    res.status(200).send({
                                      status: 200,
                                      message: "Password Changed Successfully",
                                    });
                                  } else {
                                    res.status(500).send({
                                      status: 500,
                                      message: "Something went wrong3",
                                    });
                                  }
                                });
                              } else {
                                res.status(500).send({
                                  status: 500,
                                  message: "Something went wrong4",
                                });
                              }
                            })
                            .catch((err) => {
                              res.status(500).send({
                                status: 500,
                                message: "Something went wrong5",
                              });
                            });
                        }
                      });
                    }
                  });
                }
              } else {
                res.status(400).send({ status: 400, message: "Incorrect OTP" });
              }
            } else {
              res
                .status(400)
                .send({ status: 400, message: "User not registered" });
            }
          })
          .catch((err) => {
            res
              .status(500)
              .send({ status: 500, message: "Something went wrong6" });
          });
      } else {
        res.status(400).send({ status: 400, message: "User not registered" });
      }
    })
    .catch((err) => {
      res.status(500).send({ status: 500, message: "Something went wrong7" });
    });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  User.find({ email: email })
    .then((r1) => {
      if (r1.length > 0) {
        bcrypt.compare(password, r1[0].password, function (err, status) {
          if (err) {
            res
              .status(500)
              .send({ status: 500, message: "Something went wrong" });
          } else {
            if (status == 1) {
              res.status(200).send({
                status: 200,
                data: {
                  name: r1[0].name,
                  email: r1[0].email,
                  phone: r1[0].phone,
                  work: r1[0].work,
                  u_id: r1[0]._id,
                },
                message: "Successfully Signed In",
              });
            } else {
              res
                .status(400)
                .send({ status: 400, message: "INCORRECT PASSWORD" });
            }
          }
        });
      } else {
        res
          .status(400)
          .send({ status: 400, message: "You are not a registered user" });
      }
    })
    .catch((err) => {
      res.status(500).send({ status: 500, message: "Something went wrong" });
    });
});

router.get("/getAllUsers", (req, res) => {
  User.find({})
    .then((result) => {
      if (result.length > 0) {
        res.status(200).send({ status: 200, data: result });
      } else {
        res.status(200).send({ status: 200, data: [] });
      }
    })
    .catch((err) => {
      res.status(500).send({ status: 500, message: "Something went wrong" });
    });
});

router.post("/addProduct", (req, res) => {
  const { name, price, discount, description, image, category, brand } =
    req.body;
  Product.insertMany({
    name: name,
    price: price,
    discount: discount,
    description: description,
    image: image,
    category: category,
    brand: brand,
  })
    .then((result) => {
      if (result.length > 0) {
        res
          .status(200)
          .send({ status: 200, message: "Product added successfully" });
      } else {
        res.status(401).send({ status: 401, message: "Product not added" });
      }
    })
    .catch((err) => {
      res.status(401).send({ status: 401, message: "Something went wrong" });
    });
});
router.get("/getAllProducts", (req, res) => {
  Product.find({})
    .then((result) => {
      if (result.length > 0) {
        res.status(200).send({ status: 200, data: result });
      } else {
        res.status(200).send({ status: 200, data: [] });
      }
    })
    .catch((err) => {
      res.status(500).send({ status: 500, message: "Something went wrong" });
    });
});

router.post("/addToCart", (req, res) => {
  const { p_id, u_id, quantity } = req.body;
  Cart.insertMany({
    p_id: p_id,
    u_id: u_id,
    quantity: 1,
    time: Number(new Date(Date.now())),
  })
    .then((r1) => {
      if (r1.length > 0) {
        res
          .status(200)
          .send({
            status: 200,
            message: "Product Added Successfully to the Cart",
          });
      } else {
        res.status(500).send({ status: 500, message: "Something went wrong" });
      }
    })
    .catch((err) => {
      res.status(500).send({ status: 500, message: "Something went wrong" });
    });
});

router.get("/getMyCart", (req, res) => {
  const { u_id } = req.query;
  Cart.find({ u_id: u_id })
    .then((result) => {
      res.status(200).send({ status: 200, data: result, count: result.length });
    })
    .catch((err) => {
      res.status(500).send({ status: 500, message: "Something went wrong" });
    });
});

router.get("/getDetailedCartData",(req, res) => {
  const { u_id } = req.query;
  Cart.find({ u_id: u_id })
    .then(async(result) => {
      
      for(let i=0;i<result.length;i++)
      {
        let pd = await Product.findOne({_id:result[i].p_id})
        result[i]._doc['p_data'] = pd
      }
      res.status(200).send({ status: 200, data: result, count: result.length });
    })
    .catch((err) => {
      res.status(500).send({ status: 500, message: "Something went wrong" });
    });
});
router.post("/handleQuantity",(req,res)=>{
  const {cd_id,quan} = req.body
  if(quan !== 0)
  {
    Cart.updateOne({_id:cd_id},{$set:{quantity:quan}})
    .then((r1)=>{
      if(r1.modifiedCount == 1)
      {
        res.status(200).send({status:200,data:"Quantity updated"})
      }
      else
      {
        res.status(400).send({status:400,data:"Try again"})
      }
    }).catch((err)=>{
      res.status(500).send({status:500,data:"Something went wrong"})
    })
  }
  else {
    Cart.deleteOne({_id:cd_id})
    .then((r1)=>{
      if(r1.deletedCount == 1)
      {
        res.status(200).send({status:200,data:"Item removed"})
      }
      else
      {
        res.status(400).send({status:400,data:"Try again"})
      }
    }).catch((err)=>{
      res.status(500).send({status:500,data:"Something went wrong"})
    })
  }
})

router.post("/purchaseOrder",async(req,res)=>{
  const {o_data,u_id,u_name,total,email} = req.body
  let orderNum = Number(Math.floor(Math.random()*456745).toString().padStart(6,'0'))
  Order.insertMany({u_id:u_id,ord_id:orderNum,o_data:o_data,time:Number(new Date(Date.now())),status:0,total:total})
  .then(async(result)=>{
    if(result.length>0)
    {
      for(let i=0;i<o_data.length;i++)
      {
        try {
          let st = await Cart.deleteOne({_id:o_data[i]._id})
        }
        catch(err) {
          res.status(400).send({status:400, message:"Something went wrong"}) 
          break
        }
      };
      transporter
      .sendMail({
        from: '"The Silai Company" <dushyantbansal20003@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Order Purchase", // Subject line
        text: `Hello ${u_name}Thanks for placing order`, // plain text body
        // html body
        html:`<h3>Your order is succesfully placed Order No. ${orderNum} Thanks</h3>`
      })
      .then((m_res) => {
        res.status(201).json({ message: "Order received successfully" });
      })
      .catch((err) => {
        console.log(err);
      })
    }
    else {
      res.status(400).send({status:400, message:"Something went wrong"})
    }
  }).catch((err)=>{
    console.log(err)
    res.status(500).send({status:500, message:"Something went wrong"})
  })
})

router.get("/getAllOrders",(req,res)=>{
  const {u_id } = req.query
  Order.find({u_id:u_id})
  .then((result)=>{
    res.status(200).send({status:200,data:result})
  }).catch((err)=>{
    res.status(500).send({status:200,message:"Something went wrong"})
  })
})


module.exports = router;