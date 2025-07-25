var express = require("express");
var app = express();
var port = 3000;

var mysql2 = require("mysql2");
var nodemailer = require("nodemailer");
require('dotenv').config();
var Email = process.env.main_email;
var Pass = process.env.app_pass;

app.listen(port, function () {
    console.log("Server started at port no:3000");
})



app.use(express.static("public"));
app.use(express.urlencoded(true));
app.use(express.json());

app.get("/", function (req, resp) {
    console.log(__dirname);
    console.log(__filename);

    let path = __dirname + "/index.html";
    resp.sendFile(path);
})

let otp;

app.post("/mail_otp", function (req, resp) {

    let txtEmail = req.body.email;
    let name = req.body.name;

    console.log(txtEmail);
    console.log(Email);
    console.log(name);

     otp = Math.floor(1000 + Math.random() * 9000);

    var mailer = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: Email,
            pass: Pass
        }
    });

    var maildetail = {
        from: Email,
        to: txtEmail,
        subject: 'OTP for gdg_project',
        text: `your otp is ${otp}`
    }

    mailer.sendMail(maildetail, function (err, result) {

        if (err) {
            console.log(err);
        }
        else{
            console.log(result);
            resp.send("check you email!");
        }




    })
})

app.get("/match_otp",function(req,resp){
    let txtotp = req.query.otp;
    
    if(otp == txtotp){
        resp.send("verified");
    }
    else
        resp.send("otp invalid");
})