var express = require("express");
var app = express();
var jwt = require('jsonwebtoken');
var port = 3000;


var mysql2 = require("mysql2");
let dbconfig = "mysql://avnadmin:AVNS_bQ3CJKDJDEa2iFRFeDi@mysql-1917bd63-adityajindal704-0cd0.j.aivencloud.com:20741/defaultdb"
let mySqlVen = mysql2.createConnection(dbconfig);

mySqlVen.connect(function (errKuch) {
    if (errKuch == null)
        console.log("AiVen Connnected Successfully");
    else
        console.log(errKuch.message);
})



var nodemailer = require("nodemailer");
require('dotenv').config();
var Email = process.env.main_email;
var Pass = process.env.app_pass;
var secret = process.env._secret;

app.listen(port, function () {
    console.log("Server started at port no:3000");
})

var cookieParser = require('cookie-parser');


app.use(express.static("public"));
app.use(express.urlencoded(true));
app.use(express.json());
app.use(cookieParser());

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

    // console.log(txtEmail);
    // console.log(Email);
    // console.log(name);

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
        else {
            console.log(result);
            resp.send("check you email!");
        }




    })
})

app.get("/sign_up", function (req, resp) {
    let txtotp = req.query.otp;
    let txtEmail = req.query.email;
    let txtName = req.query.name;

    if (otp == txtotp) {

        mySqlVen.query("insert into signup_details values(?,?,current_date())",[txtEmail,txtName],function(err){
            if(err != null){
                resp.send(err);
            }
        })

        
   let token = jwt.sign({ mailid: txtEmail } ,secret)
   resp.cookie("token",token);

    // console.log(token);
    resp.send("done");
    }
    else {
        resp.send("otp invalid");
    }

})

app.get("/read",function(req,resp){
    let data = jwt.verify(req.cookies.token , secret);
    console.log(data.mailid);
    txtEmail = data.mailid;
})