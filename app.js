// jshint esversion:6

// *********************************************** */
// Modules declaration
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate")
const FacebookStrategy = require("passport-facebook")

// *********************************************** */
// ENV variables MUST BE DECLARED IN A .env FILE
require("dotenv").config();
const PORT = process.env.PORT
const SECRET = process.env.SECRET
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET

// *********************************************** */
// APP set and use
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({secret: SECRET, resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());


// *********************************************** */
// DB construction
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});
// mongoose.set("useCreateIndex", true);  //Is not useful anymore
const userSchema = new mongoose.Schema({
    email: String, 
    password: String, 
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
const User = new mongoose.model("User", userSchema);

// *********************************************** */
// PASSPORT SET UP
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, function (accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({
        googleId: profile.id,
        username: profile.displayName
    }, function (err, user) {
        return cb(err, user);
    });
}));

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
}, function (accessToken, refreshToken, profile, cb) {
    // console.log(profile)
    User.findOrCreate({
        facebookId: profile.id,
        username: profile.displayName
    }, function (err, user) {
        return cb(err, user);
    });
}));


// *********************************************** */
// APP RUNNING
app.get("/", function (req, res) {
    res.render("home");
});

// GOOGLE AUTH
app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}));
app.get("/auth/google/secrets", passport.authenticate("google", {failureRedirect: "/login"}), function (req, res) { 
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

// FACEBOOK AUTH
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/secrets', passport.authenticate('facebook', {failureRedirect: '/login'}), function (req, res) { 
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

// REST OF THE APP
app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {
    User.find({"secret":{$ne: null}}).then(function(foundUsers){
        res.render("secrets", {usersWithsecrets: foundUsers});
    }).catch(function(err){
        console.log(err);
    })
})

app.get("/logout", function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        console.log("Logged out succesfuly");
        res.redirect('/');
    });
})

app.get("/submit", function(req,res){
    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/login")
    }
})

app.post("/register", function (req, res) {
    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    })
})

app.post("/login", function (req, res) {
    const user = new User({username: req.body.username, password: req.body.password});

    req.login(user, function (err) {
        if (err) {
            console.log();
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        }
    })
});

app.post("/submit", function(req,res){
    const submittedSecret = req.body.secret;
    console.log(req.user._id);
    User.findById(req.user._id).then(function(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save().then(function(){
            res.redirect("/secrets");
        })
    }).catch(function(err){
        console.log(err);
    })
})

// *********************************************** */
// LISTEN
app.listen(PORT, function () {
    console.log("Server running on port: " + PORT);
});
