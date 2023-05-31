//jshint esversion:6

//*********************************************** */
// Modules declaration
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash")
const mongoose = require("mongoose")
const app = express();
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

//*********************************************** */
// ENV variables
require("dotenv").config();
const PORT = process.env.PORT
const SECRET = process.env.SECRET

//*********************************************** */
// APP set and use
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


//*********************************************** */
// DB construction
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});
// mongoose.set("useCreateIndex", true);  //Is not useful anymore
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//*********************************************** */
//APP RUNNING
app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req,res){
    console.log(req.isAuthenticated());
    if(req.isAuthenticated()){
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})

app.get("/logout", function(req,res, next){
    req.logout(function(err) {
        if (err) { 
            return next(err); 
        }
        console.log("Logged out succesfuly");
        res.redirect('/');
      });
})

app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
    })
})

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log();
        } else{ 
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets")
            })
        }
    })
});

//*********************************************** */
//LISTEN
app.listen(PORT, function () {
    console.log("Server running on port: " + PORT);
});