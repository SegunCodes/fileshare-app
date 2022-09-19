const express = require("express")
const app = express()
const dotenv = require("dotenv")
dotenv.config()
const session = require("express-session")
const expressLayouts = require("express-ejs-layouts")
const bodyParser = require("body-parser");
// const formidable = require("formidable")
const fileUpload  = require("express-fileupload")
app.use(fileUpload())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
// app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.use(expressLayouts)
app.use(session({
    secret: "secretKey",
    saveUninitialized: false,
    resave: false
}))
app.use(function(req, res, next){
    req.isLogin =  (typeof req.session.user !== "undefined");
    req.user = req.session.user;
    next();
})
app.set('layout', './layouts/main')
app.set("view engine", "ejs");

const routes = require('./server/routes/mainRoutes.js')
app.use("/", routes)

app.listen(process.env.PORT || 5000, ()=>{
    console.log("Backend server running");
})