//jshint esversion:6
// Modules declaration
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash")
const mongoose = require("mongoose")
const app = express();
var encrypt = require('mongoose-encryption');

// ENV variables
require("dotenv").config();
const PORT = process.env.PORT

// APP set and use
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// DB construction
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true})
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
const secret = "Thisisourlittlescret.";
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']})
const User = new mongoose.model("User", userSchema)

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

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })
    newUser.save()
    .then(function(){
        console.log("Succesfully added");
        res.render("secrets")
    })
    .catch(function(err){
        console.log(err);
    })
})

app.post("/login", function(req, res){
    const loginusername = req.body.username;
    const loginpassword = req.body.password;
    User.find({email: loginusername, password: loginpassword}).exec()
        .then(function(foundUser) {
            if (foundUser) {
                // User found, handle authentication success
                res.render("Secrets");
            } else {
                // User not found or authentication failed
                console.log("User not found or authentication failed");
            }
        })
        .catch(function(err) {
            // Error occurred during database query
            console.log(err);
        });
});


//LISTEN
app.listen(PORT, function () {
    console.log("Server running on port: " + PORT);
});