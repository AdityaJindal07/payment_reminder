var express = require("express");
var app = express();
var jwt = require('jsonwebtoken');
var port = 3000;
require('dotenv').config();

var mysql2 = require("mysql2");
var dbconfig = process.env.db_config;
let mySqlVen = mysql2.createConnection(dbconfig);

mySqlVen.connect(function (errKuch) {
    if (errKuch == null)
        console.log("AiVen Connnected Successfully");
    else
        console.log(errKuch.message);
})



var nodemailer = require("nodemailer");

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

    mySqlVen.query("select * from signup_details where emailid = ?", [txtEmail], function (err, allRecords) {

        if (allRecords.length == 0) {

            mailer.sendMail(maildetail, function (err, result) {

                if (err) {
                    console.log(err);
                }
                else {
                    console.log(result);
                    resp.send("check you email!");
                }

            })

        }
        else {
            resp.send("already signed up");
        }
    })






})


app.post("/mail_otp2", function (req, resp) {

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

    mySqlVen.query("select * from signup_details where emailid = ?", [txtEmail], function (err, allRecords) {

        if (allRecords.length != 0) {

            mailer.sendMail(maildetail, function (err, result) {

                if (err) {
                    console.log(err);
                }
                else {
                    console.log(result);
                    resp.send("check you email!");
                }

            })

        }
        else {
            resp.send("plz sign up first");
        }
    })






})


app.get("/sign_up", function (req, resp) {
    let txtotp = req.query.otp;
    let txtEmail = req.query.email;
    let txtName = req.query.name;

    if (otp == txtotp) {

        mySqlVen.query("insert into signup_details values(?,?,current_date())", [txtEmail, txtName], function (err) {
            if (err) {
                resp.send(err);
            }
        })


        let token = jwt.sign({ mailid: txtEmail }, secret)
        resp.cookie("token", token);

        // console.log(token);
        resp.send("done");
    }
    else {
        resp.send("otp invalid");
    }

})






app.get("/sign_in", function (req, resp) {
    let txtotp = req.query.otp;
    let txtEmail = req.query.email;

    if (txtotp == otp) {
        mySqlVen.query("select * from signup_details where emailid = ?", [txtEmail], function (err, allRecords) {

            if (allRecords.length == 0) {
                resp.send("Invalid");
            }
            else {

                let token = jwt.sign({ mailid: txtEmail }, secret)
                resp.cookie("token", token);

                resp.send("valid");
            }
        })
    }
})


app.get("/read", function (req, resp) {
    let data = jwt.verify(req.cookies.token, secret);
    console.log(data.mailid);
    txtEmail = data.mailid;
})

let rid;

app.post("/post_payment", function (req, resp) {

    let emailid = req.body.emailid;
    let paymentname = req.body.paymentname;
    let Category = req.body.Category;
    let amount = req.body.amount;
    let deadline = req.body.deadline;
    let otherinfo = req.body.otherinfo;

    rid = Math.floor(1000 + Math.random() * 9000);

    mySqlVen.query("insert into payment_details(rid ,emailid, paymentname, Category, amount, deadline,status, otherinfo) values(?,?,?,?,?,?,?,?)", [rid, emailid, paymentname, Category, amount, deadline, "pending", otherinfo], function (err) {
        if (err) {
            resp.send("somethings wrong");
        }
        else {
            resp.send("good");
        }
    })


})

app.post("/get_id", function (req, resp) {

    mySqlVen.query("select * from payment_details where rid=?", [rid], function (err, allRecords) {
        if (allRecords.length == 0) {
            resp.send("somethings wrong");
        }
        else if (allRecords.length == 1) {

            resp.send(rid);
        }
    })
})

app.get("/do-fetch-all", function (req, resp) {

    mySqlVen.query("select * from payment_details", function (err, allRecords) {
        if (err) {
            resp.send(err);

        }
        else {
            resp.send(allRecords);
        }
    })
})

app.get("/do_logout", function (req, resp) {
    resp.cookie("token","");
    resp.redirect("/");
})

app.patch("/paid",function(req,resp){
    let rid = req.body.rid;

    mySqlVen.query("update payment_details set status=? where rid=?",["paid",rid],function(err){
        if(err){
            resp.send(err.message);
        }
        else
        resp.send("updated");
    })
})
app.patch("/overdue",function(req,resp){
    let rid = req.body.rid;

    mySqlVen.query("update payment_details set status=? where rid=?",["overdue",rid],function(err){
        if(err){
            resp.send(err.message);
        }
        else{
            resp.send("updated")
        }
    })
})

app.patch("/cancelled",function(req,resp){
    let rid = req.body.rid;

    mySqlVen.query("update payment_details set status=? where rid=?",["cancelled",rid],function(err){
        if(err){
            resp.send(err.message);
        }
        else{
            resp.send("updated")
        }
    })
})

app.patch("/pending",function(req,resp){
    let rid = req.body.rid;

    mySqlVen.query("update payment_details set status=? where rid=?",["pending",rid],function(err){
        if(err){
            resp.send(err.message);
        }
        else{
            resp.send("updated")
        }
    })
})

