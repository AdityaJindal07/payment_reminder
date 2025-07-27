var express = require("express");
var app = express();
var jwt = require('jsonwebtoken');
var port = 3000;
require('dotenv').config();

var mysql2 = require("mysql2");
var dbconfig = process.env.db_config;
let mySqlVen = mysql2.createConnection(dbconfig);
var schedule = require("node-schedule");

mySqlVen.connect(function (errKuch) {
    if (errKuch == null) {
        console.log("AiVen Connnected Successfully");
        scheduleReminders();
    }
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


function verifyToken(req, res, next) {
    let token = req.cookies.token;

    if (!token) {
        res.send("Access Denied. No token provided.");
        return;
    }

    let verified = jwt.verify(token, secret);

    if (verified) {
        req.user = verified;
        console.log(req.user)
        next();
    } else {
        res.send("Invalid Token");
    }
}


app.get("/read", function (req, resp) {
    let data = jwt.verify(req.cookies.token, secret);
    console.log(data.mailid);
    txtEmail = data.mailid;
    resp.send(txtEmail);
})

let rid;

app.post("/post_payment", verifyToken, function (req, resp) {

    let emailid = req.body.emailid;
    let paymentname = req.body.paymentname;
    let Category = req.body.Category;
    let amount = req.body.amount;
    let deadline = req.body.deadline;
    let otherinfo = req.body.otherinfo;

    rid = Math.floor(100000 + Math.random() * 900000);

    mySqlVen.query("insert into payment_details(rid ,emailid, paymentname, Category, amount, deadline,status, otherinfo) values(?,?,?,?,?,?,?,?)", [rid, emailid, paymentname, Category, amount, deadline, "pending", otherinfo], function (err) {
        if (err) {
            resp.send("somethings wrong");
        }
        else {
            scheduleReminders();
            resp.send("good");
        }
    })


})

app.post("/get_id", verifyToken, function (req, resp) {

    mySqlVen.query("select * from payment_details where rid=?", [rid], function (err, allRecords) {
        if (allRecords.length == 0) {
            resp.send("somethings wrong");
        }
        else if (allRecords.length == 1) {

            resp.send(rid);
        }
    })
})



app.get("/do-fetch-all", verifyToken, function (req, resp) {

    console.log(req.user.mailid);

    mySqlVen.query("select * from payment_details where emailid = ?",[req.user.mailid], function (err, allRecords) {
        if (err) {
            resp.send(err);

        }
        else {
            for (var i = 0; i < allRecords.length; i++) {
                if (allRecords[i].deadline) {
                  
                    Intl.DateTimeFormat('en-in').format(allRecords[i].deadline)
                }
            }
            resp.send(allRecords);
        }
    })
})

app.get("/do_logout", verifyToken, function (req, resp) {
    resp.cookie("token", "");
    resp.redirect("/");
})

app.patch("/paid", verifyToken, function (req, resp) {
    let rid = req.body.rid;

    mySqlVen.query("update payment_details set status=? where rid=?", ["paid", rid], function (err) {
        if (err) {
            resp.send(err.message);
        }
        else
            resp.send("updated");
    })
})


app.patch("/cancelled", verifyToken, function (req, resp) {
    let rid = req.body.rid;

    mySqlVen.query("update payment_details set status=? where rid=?", ["cancelled", rid], function (err) {
        if (err) {
            resp.send(err.message);
        }
        else {
            resp.send("updated")
        }
    })
})

app.patch("/pending", verifyToken, function (req, resp) {
    let rid = req.body.rid;

    mySqlVen.query("update payment_details set status=? where rid=?", ["pending", rid], function (err) {
        if (err) {
            resp.send(err.message);
        }
        else {
            resp.send("updated")
        }
    })
})

function mail_reminder(emailid, paymentname, deadline, rid) {

    console.log("sending mail");

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
        to: emailid,
        subject: `payment-reminder for id: ${rid}`,
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Reminder</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f4f4;
      color: #333;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      padding: 30px;
    }
    h2 {
      color: #007bff;
      text-align: center;
    }
    .info {
      font-size: 16px;
      margin: 20px 0;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      font-size: 14px;
      color: #888;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>🔔 Payment Due Reminder</h2>
    <p class="info">
      Dear User,<br><br>
      This is a gentle reminder that your payment is due on <strong>${deadline}</strong>.<br><br>
      <strong>Payment Name:</strong> ${paymentname}<br>
      <strong>Payment ID:</strong> ${rid}<br>
      <strong>Email:</strong> ${emailid}<br><br>
      Please make sure to complete the payment before the due date to avoid any inconvenience.
    </p>
    <div class="footer">
      Thank you for your attention.<br>
      — gdg-LNMIIT
    </div>
  </div>
</body>
</html>
`
    }


    mailer.sendMail(maildetail, function (err, result) {

        if (err) {
            console.log(err);
        }
        else {
            console.log(result);
            // resp.send("check you email!");
        }

    })



}



function mail_reminder_overdue(emailid, paymentname, deadline, rid) {

    console.log("sending mail");

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
        to: emailid,
        subject: `payment-reminder for id: ${rid}`,
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Overdue Payment Notice</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f4f4;
      color: #333;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      padding: 30px;
    }
    h2 {
      color: #dc3545;
      text-align: center;
    }
    .info {
      font-size: 16px;
      margin: 20px 0;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      font-size: 14px;
      color: #888;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>⚠️ Overdue Payment Alert</h2>
    <p class="info">
      Dear User,<br><br>
      Our records show that your payment due on <strong>${deadline}</strong> has not been completed.<br><br>
      <strong>Payment Name:</strong> ${paymentname}<br>
      <strong>Payment ID:</strong> ${rid}<br>
      <strong>Email:</strong> ${emailid}<br><br>
      Kindly take immediate action to settle the payment and avoid any further issues.
    </p>
    <div class="footer">
      This is an automated reminder from gdg-LNMIIT.<br>
      Thank you for your prompt attention.
    </div>
  </div>
</body>
</html>
`

    }


    mailer.sendMail(maildetail, function (err, result) {

        if (err) {
            console.log(err);
        }
        else {
            console.log(result);
            // resp.send("check you email!");
        }

    })



}



const scheduledJobs = new Map();

function scheduleReminders() {
    mySqlVen.query("SELECT * from payment_details", function (err, results) {
        if (err) return console.log("DB error:", err);

        results.forEach(function (task) {
            const key1 = `${task.rid}-2days`;
            const key2 = `${task.rid}-30sec`;
            const key3 = `${task.rid}-0sec`;

            if (task.status == "pending") {

                let reminderTime1 = new Date(new Date(task.deadline) - 2 * 24 * 60 * 60 * 1000);
                let reminderTime2 = new Date(task.deadline);
                
                let reminderTime3 = new Date(task.deadline);
                reminderTime3.setHours(23, 59, 59, 999);
                if (reminderTime1 > new Date() && !scheduledJobs.has(key1)) {
                    const job1 = schedule.scheduleJob(reminderTime1, function () {
                        mail_reminder(task.emailid, task.paymentname, task.deadline, task.rid);
                        scheduledJobs.delete(key1);
                    });
                    scheduledJobs.set(key1, job1);
                }
                if (reminderTime2 > new Date() && !scheduledJobs.has(key2)) {
                    const job2 = schedule.scheduleJob(reminderTime2, function () {
                        mail_reminder(task.emailid, task.paymentname, task.deadline, task.rid);
                        scheduledJobs.delete(key2);
                    });
                    scheduledJobs.set(key2, job2);
                }
                if (reminderTime3 > new Date()) {


                    const job3 = schedule.scheduleJob(reminderTime3, function () {
                        mySqlVen.query("update payment_details set status = ? where rid = ?", ["overdue", task.rid], function (err) {
                            if (err) {
                                console.log(err);
                            }
                            else{
                                console.log("overdue");
                            }
                        })
                        mail_reminder_overdue(task.emailid, task.paymentname, task.deadline, task.rid);
                        scheduledJobs.delete(key3);
                    });
                    scheduledJobs.set(key3, job3);
                }

            }
        });


    });
}



// scheduleReminders();
// console.log("scheduleReminders started");

schedule.scheduleJob('0 0 * * *', function () {
    console.log("Running daily scheduleReminders...");
    scheduleReminders();
});
