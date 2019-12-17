var LocalStrategy = require('passport-local').Strategy;
//userSchema
var passport = require('passport');
var Facilitator = require('../models/user.js');
var Admin = require('../models/admin.js');
var Student = require('../models/admin.js');
//database r
var config = require('../config/key.js');
//bcryptjs

var bcrypt = require('bcryptjs');

module.exports = function (passport) {

    //local strategy
    passport.use('superAdmin',new LocalStrategy(function (username, password, done) {
        //match Username
        let query = {
            username: username
        };
        Admin.findOne(query, function (err, user) {
            if (err)
                throw err;
            if (!user) {
                return done(null, false, {
                    message: 'No User Found'
                });
            }
            //Match Password
            bcrypt.compare(password, user.password, function (err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Wrong Password'
                    });
                }
            });
        });

    }));
    passport.use('facilitator',new LocalStrategy(function (username, password, done) {
        //match Username
        let query = {
            username: username
        };
        Facilitator.findOne(query, function (err, user) {
            if (err)
                throw err;
            if (!user) {
                return done(null, false, {
                    message: 'No User Found'
                });
            }
            //Match Password
            bcrypt.compare(password, user.password, function (err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Wrong Password'
                    });
                }
            });
        });

    }));
    passport.use('student',new LocalStrategy(function (username, password, done) {
        //match Username
        let query = {
            username: username
        };
        Student.findOne(query, function (err, user) {
            if (err)
                throw err;
            if (!user) {
                return done(null, false, {
                    message: 'No User Found'
                });
            }
            //Match Password
            bcrypt.compare(password, user.password, function (err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Wrong Password'
                    });
                }
            });
        });

    }));
    function SessionConstructor(userId, userGroup, details) {
        this.userId = userId;
        this.userGroup = userGroup;
        this.details = details;
    }
    
    passport.serializeUser(function (userObject, done) {
        // userObject could be a Model1 or a Model2... or Model3, Model4, etc.
        //let userGroup = "model1";
        let userPrototype =  Object.getPrototypeOf(userObject);
      
        if (userPrototype === Facilitator.prototype) {
            userGroup = "model1";
        } else if (userPrototype === Student.prototype) {
            userGroup = "model2";
        } else if (userPrototype === Admin.prototype) {
            userGroup = "model3";
        }
    
        let sessionConstructor = new SessionConstructor(userObject.id, userGroup, '');
        done(null,sessionConstructor);
    });
    
    passport.deserializeUser(function (sessionConstructor, done) {
    
        if (sessionConstructor.userGroup == 'model1') {
            Facilitator.findOne({
                _id: sessionConstructor.userId
            },'-facilitator', function (err, user) { // When using string syntax, prefixing a path with - will flag that path as excluded.
                done(err, user);
            });
        } else if (sessionConstructor.userGroup == 'model2') {
            Student.findOne({
                _id: sessionConstructor.userId
            },'-student', function (err, user) { // When using string syntax, prefixing a path with - will flag that path as excluded.
                done(err, user);
            });
        } 
        else if (sessionConstructor.userGroup == 'model3') {
            Admin.findOne({
                _id: sessionConstructor.userId
            },'-superAdmin', function (err, user) { // When using string syntax, prefixing a path with - will flag that path as excluded.
                done(err, user);
            });
        } 
    
    });
}
