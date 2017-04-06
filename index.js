/*;
copier.execute_copy(master_token,slave_token);*/


var flash = require('express-flash');
var express=require('express');
var path = require('path');
var os = require("os");
var app=express();
var router=express.Router();
var cookieParser = require('cookie-parser');
var bodyParser =require('body-parser');
var copier=require('./core/copier.js');
var passport=require('passport'); 
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var configDB = require('./config/database.js');
var session = require('express-session');

var User  = require('./app/models/user');
mongoose.connect(configDB.url,function(err){if(err) throw err;}); 
app.use('/', router);
app.use('/css', express.static('public/assets/css'));
app.use('/js', express.static('public/assets/js'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser()); 
app.use(flash());


app.use(session({ secret: 'binarycopysession',resave:false,saveUninitialized:true })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.set('views', path.join(__dirname, '/public/views'));
app.get('/home', isLoggedIn, function(req, res) {  
    var master_tok,slave_tok=' ';
    var tokens;
    if(typeof app.get(req.user.email)!='undefined')
        {
            tokens=app.get(req.user.email);
            master_tok=tokens.master;
            slave_tok=tokens.slave;
        }
  res.render('index', { title: "Binary Trade Copier" ,user:req.user,master:master_tok,slave:slave_tok});
});
app.get('/', function(req, res) {  

  res.render('login', { title: "Binary Trade Copier" ,data:app.get('data')});
});
app.get('/signup', function(req, res) {  

  res.render('signup', { title: "Binary Trade Copier"});
});
app.post('/interact', function(req, res, next){
    var master_token=req.body.master;
    var slave_token=req.body.slave;
    var tokens={
        master:master_token,
        slave:slave_token
    }
    app.set(req.user.email,tokens);
    var action=req.body.submit;
    app.locals.master=master_token;
    app.locals.slave=slave_token;
    copier.executeCopy(master_token,slave_token,action);
    res.redirect('/home');
});
 app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/home', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
 app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/home', // redirect to the secure profile section
        failureRedirect : '/', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/signup');
}



//Sign in passport strategy


passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));

//end
 passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {

                // if there is no user with that email
                // create the user
                var newUser            = new User();

                // set the user's local credentials
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);

                // save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }

        });    

        });

    }));


 passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

var port = process.env.PORT || 3500;
var server = app.listen(port, function () {
  console.log("App running on http://"+os.hostname()+":"+port);
});
