//jshint esversion:6

// Modules declaration
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash")
const mongoose = require("mongoose")
const app = express();

// ENV variables
require("dotenv").config();
const PORT = process.env.PORT


// APP set and use
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// DB construction
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true})
const userSchema = {
    email: String,
    password: String
}
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

app.post("/login", function(req,res){
    const username = req.body.username
    const password = req.body.password
    User.findOne({email: username, password: password})
    .then(function(foundUser){
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets")
            }
        }
    })
})

//LISTEN
app.listen(PORT, function () {
    console.log("Server running on port: " + PORT);
});