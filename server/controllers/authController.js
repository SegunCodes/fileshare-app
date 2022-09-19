require('../models/database')
const User = require('../models/User')

const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer")
const nodemailerFrom = process.env.fromMail;
const nodemailerObject = {
    service : process.env.mailService,
    host : process.env.mailHost,
    port : process.env.mailPort,
    secure: true,
    // encryption : process.env.mailEncryption,
    auth : {
        user: process.env.fromMail,
        pass : process.env.mailPassword
    }
}
const redirectUrl = "https://the-fileshare-app.herokuapp.com/";
// const Recipe = require('../models/Recipe')


/**
 * Get/
 * homepage
 */
exports.homepage = async(req, res, next) =>{
    try {
        res.render('index',{ req: req });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * Get/
 * register page
 */
exports.registerPage = async(req, res, next) =>{
    try {
        if(req.user){
            res.redirect("/");
            return;
        }
        res.render('register',{ title: 'Register | File Share', req: req });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Process/
 * registration
 */
 exports.processRegistration = async(req, res, next) =>{
    try {
        const username = req.body.username
        const email = req.body.email
        const password = req.body.password
        const verificationToken = new Date().getTime();

        const checkUser = await User.findOne({"email" : email});
        if(checkUser == null){
            bcrypt.hash(password, 10, async function (error, hash){
                await User.create({
                    "username" : username,
                    "email" : email,
                    "password": hash,
                    "verificationToken" : verificationToken,
                }, async function(error, data){
                    const transporter = nodemailer.createTransport(nodemailerObject);
                    const text = "Thank you for joining FileShare, Please verify your account by clicking on this link: <br><br> "+redirectUrl+"/verifyEmail/"+email+"/"+verificationToken;
                    const html = "Thank you for joining FileShare, Please verify your account by clicking on this link: <br><br> <a href='"+redirectUrl+"/verifyEmail/"+email+"/"+verificationToken +"'>Confirm Mail</a> <br><br>Thank You ";
                    await transporter.sendMail({
                        from: nodemailerFrom,
                        to: email,
                        subject: "Email Verification",
                        text: text,
                        html: html
                    }, function (error, info){
                        if(error){
                            console.error(error)
                        }else{
                            console.log("Email sent" + info.response)
                        }
                        req.status = "success"
                        req.message = "Signed up successfully. An email has been sent to verify your account. Once verified, you can start using file share."
                        res.render('register',{ title: 'Register | File Share', req: req });
                    })
                })
            });
        }else{
            req.status = "error"
            req.message = "Email already exist"
            res.render('register',{ title: 'Register | File Share', req: req });
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * verifyEmail
 */
exports.verifyEmail = async(req, res, next) =>{
    try {
        const email = req.params.email;
        const verificationToken = req.params.verificationToken;

        const user = await User.findOne({
            $and: [{
                "email":email,
            }, {
                "verificationToken": parseInt(verificationToken)
            }]
        });
        if (!user) {
            req.status = "error";
            req.message = "Email does not exist or token has expired";
            res.render('login',{ title: 'Verify Email | File Share', req: req });
        } else {
            await User.findOneAndUpdate({
                $and: [{
                    "email":email,
                }, {
                    "verificationToken": parseInt(verificationToken)
                }]
            },{
                $set: {
                    "verificationToken": "",
                    "isVerified": true
                }
            })
            req.status = "success";
            req.message = "Email has been verified, please login";
            res.render('login',{ title: 'Verify Email | File Share', req: req});
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * login page
 */
 exports.loginPage = async(req, res, next) =>{
    try {
        if(req.user){
            res.redirect("/");
            return;
        }
        res.render('login',{ title: 'Login | File Share', req: req });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * post/
 * process login
 */
 exports.processLogin = async(req, res, next) =>{
    try {
        const user = await User.findOne({email:req.body.email});
        if (!user) {
            req.status = "error";
            req.message = "user not found";
            res.render('login',{ title: 'Login | File Share', req: req });
            return false;
        }
        bcrypt.compare(req.body.password, user.password, function(error, isVerify){
            if (isVerify) {
                if (user.isVerified) {
                    req.session.user = user;
                    // req.islogin = true
                    res.redirect("/");
                    return true;
                }else{
                    req.status = "error";
                    req.message = "Kindly verify your email address";
                    res.render('login',{ title: 'Login | File Share', req: req });
                    return false;
                }
            }else{
                req.status = "error";
                req.message = "Incorrect password";
                res.render('login',{ title: 'Login | File Share', req: req });
                return false;
            }
        });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * forgot password page
 */
 exports.forgotPasswordPage = async(req, res, next) =>{
    try {
        if(req.user){
            res.redirect("/");
            return;
        }
        res.render('forgot-password',{ title: 'Forgot Password | File Share', req: req });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Post/
 * send Recovery Link
 */
exports.sendRecoveryLink = async(req, res, next) =>{
    try {
        const email = req.body.email
        const user = await User.findOne({email:email});
        if (!user) {
            req.status = "error";
            req.message = "Email does not exist";
            res.render('forgot-password',{ title: 'Forgot Password | File Share', req: req });
            return false;
        }
        const resetToken = new Date().getTime()
        await User.findOneAndUpdate({
            "email": email
        }, {
            $set: {
                "resetToken" : resetToken
            }
        })
        const transporter = nodemailer.createTransport(nodemailerObject);
        const text = "We got a reset password request from your account, click on this link to reset your password: <br><br> "+redirectUrl+"/resetPassword/"+email+"/"+resetToken;
        const html = "We got a reset password request from your account, click on this link to reset your password: <br><br> <a href='"+redirectUrl+"/resetPassword/"+email+"/"+resetToken +"'>Reset Password</a> <br><br>Thank You ";
        await transporter.sendMail({
            from: nodemailerFrom,
            to: email,
            subject: "Reset Password",
            text: text,
            html: html
        }, function (error, info){
            if(error){
                console.error(error)
            }else{
                console.log("Email sent" + info.response)
            }
            req.status = "success"
            req.message = "Recovery link has been sent to your email address."
            res.render('forgot-password',{ title: 'Forgot Password | File Share', req: req });
        })
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * reset password page
 */
exports.resetPasswordPage = async(req, res, next) =>{
    try {
        if(req.user){
            res.redirect("/");
            return;
        }
        const email = req.params.email;
        const resetToken = req.params.resetToken;
        // const user = await User.findOne({resetToken: resetToken});
        const user = await User.findOne({
            $and: [{
                "email":email,
            }, {
                "resetToken": parseInt(resetToken)
            }]
        });
        if (!user) {
            req.status = "error";
            req.message = "Link has expired";
            res.render('error',{ title: 'Error Page | File Share', req: req });
        }

        res.render('resetPassword',{ title: 'Reset Password | File Share', req: req, "email": email, "resetToken": resetToken });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * Post/
 * reset password
 */
 exports.resetPassword = async(req, res, next) =>{
    try {
        const email = req.body.email;
        const resetToken = req.body.resetToken;
        if(req.body.password != req.body.confirmPassword){
            req.status = "error";
            req.message = "Password do not match";
            res.render('resetPassword',{ title: 'Reset Password | File Share', req: req, "email": email, "resetToken": resetToken });
            return false;
        }
        // const user = await User.findOne({resetToken: resetToken})
        const user = await User.findOne({
            $and: [{
                "email":email,
            }, {
                "resetToken": parseInt(resetToken)
            }]
        });
        if(!user){
            req.status = "error";
            req.message = "Email does not exist or Link has expired";
            res.render('resetPassword',{ title: 'Reset Password | File Share', req: req, "email": email, "resetToken": resetToken });
            return false;
        }
        bcrypt.hash(req.body.password, 10, async function (error, hash){

            await User.findOneAndUpdate({
                $and: [{
                    "email":email,
                }, {
                    "resetToken": parseInt(resetToken)
                }]
            },{
                $set: {
                    "resetToken": "",
                    "password" : hash
                }
            })
            req.status = "success"
            req.message = "Password successfully reset."
            res.render('Login',{ title: 'Login | File Share', req: req });
        })
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * logout
 */
 exports.logout = async(req, res, next) =>{
    try {
        req.session.destroy()
        res.redirect("/")
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}