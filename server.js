const { json } = require("express");
const express = require("express");
const mongoose = require("mongoose");
const validUrl = require("valid-url");
const bcrypt = require("bcrypt");
const shorturl = require("shortid");
const nodemailer = require("nodemailer");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const ShortUrl = require("./models/ShortUrl");
const Users = require("./models/Users");
const { db } = require("./models/ShortUrl");
const app = express();

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(
  cors({
    origin: process.env.CLIENT_URI,
  })
);

app.use(express.json());

let authenticate = (req, res, next) => {
  if (req.headers.authorization) {
    try {
      let decode = jwt.verify(req.headers.authorization, process.env.SECRET);
      if (decode) {
        next();
      }
    } catch (error) {
      res.status(401).json({ message: "Unathorized1" });
    }
  } else {
    res.status(401).json({ message: "Unathorized2" });
  }
};

app.get("/urlshortner", authenticate, async function (req, res) {
  const data = await ShortUrl.find();
  res.json(data);
});
app.post("/urlshortner", async function (req, res) {
  let data = await ShortUrl.create(req.body);
  if (!validUrl.isUri(req.body)) {
    return res.status(401), json("Invalid Url");
  }
  res.send(data);
});
app.get("/:short", async function (req, res) {
  const shortid = req.params.short;
  try {
    if (!shortid) {
      return res
        .status(404)
        .send({ msg: "No empty values allowed", type: "error" });
    }
    const shorturl = await ShortUrl.findOne({ short: shortid });
    if (shorturl == null) return res.sendStatus(404);
    shorturl.clicks++;
    await shorturl.save();
    res.redirect(shorturl.full);
  } catch (error) {
    console.log(error);
  }
});
app.post("/signup", async function (req, res) {
  try {
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(req.body.Password, salt);
    req.body.Password = hash;
   let data = await Users.create(req.body);
   res.status(200).json({message:"Sighin Successfully"})
    res.json(data)
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Somthing went wrong" });
  }
});
app.post("/login", async function (req, res) {
  try {
    let user = await Users.findOne({ Email: req.body.Email });
    if (user) {
      let compare = await bcrypt.compare(req.body.Password, user.Password);
      if (compare) {
        let token = jwt.sign({ _id: user._id }, process.env.SECRET, {
          expiresIn: "20m",
        });
      user.updateOne({token:token},function (err,sucsses){
        if(err){
          console.log(err)
        }else{

          res.json(user);
        }
      })
        
      } else {
        res.status(401).json({ message: "Username / Password is Wrong" });
      }
    } else {
      res.status(401).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Somthing went wrong" });
  }
});
app.post("/forgot", async function (req, res) {
  try {
    let user = await Users.findOne({ Email: req.body.Email });
    console.log(user);
    if (user) {
      console.log(user.Email);
      if (user.Email == req.body.Email) {
        let sender = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "logeshthirumurugan@gmail.com",
            pass: "ontzzvqgqxinughr",
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        let resettoken = jwt.sign({ _id: user._id }, process.env.SECRET, {
          expiresIn: "5m",
        });
        let link = `http://localhost:3000/${user._id}/${resettoken}`;
        let mailOptons = {
          from: "logeshthirumurugan@gmail.com",
          to: user.Email,
          subject: "Account reset link from Url Shortner",
          html: `<h2>Please Click link given link to reset your password</h2>,${link}`,
        };
        user.updateOne({ resettoken: resettoken }, function (err, sucsses) {
          if (err) {
            res.status(400).json({ message: "reset password link error" });
          } else {
            sender.sendMail(mailOptons, function (err, info) {
              if (err) {
                console.log(err);
              } else {
                console.log("Email sent" + info.response);
                res.status(200).json({ message: "rest link send to your" });
              }
            });
            res.status(200).json({ message: "rest link generated" });
          }
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "somthing went wrong" });
  }
});

app.put("/:userid/:token", async function (req, res) {
  try {
    let data = await Users.findOne({ _id: req.params.userid });
    if (data) {
      let tokenverfiy = jwt.verify(req.params.token, process.env.SECRET);
      if (tokenverfiy) {
        try {
          let salt = await bcrypt.genSalt(10);
          let hash = await bcrypt.hash(req.body.Password, salt);
          req.body.Password = hash;
          await Users.findByIdAndUpdate(data._id, {
            $set: { Password: req.body.Password, resettoken: "" },
          });

          res.status(200).json({ message: "password reset successfully" });
        } catch (error) {
          console.log(error);
          res.status(500).json({ message: "Somthing went wrong in hash" });
        }
      } else {
        res.status(404).json({ message: "link expired" });
      }
    } else {
      res.status(404).json({ message: "somthing wrong in reset password" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "somthing went wrong in geting user" });
  }
});

app.get("/urlshortner/users", authenticate, async function (req, res) {
  try {
    let data = await Users.find();
    res.json(data);
  } catch (error) {
    res.status(404).json({ message: "somthing went wrong" });
  }
});
app.delete("/urlshortner/:urlid", async function (req, res) {
  try {
    let data = await ShortUrl.findOneAndDelete({_id:req.params.urlid});
    res.json(data);
  } catch (error) {
    res.status(404).json({ message: "somthing went wrong" });
  }
});

app.listen(process.env.PORT || 3005);
