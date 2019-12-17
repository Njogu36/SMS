var express = require('express');
var bcrypt = require('bcryptjs');
var flash = require('connect-flash');
var passport = require('passport');
var User = require('../models/user.js');
var Admin = require('../models/admin.js');
var Customer = require('../models/customer.js')
var Basic = require('../models/basic.js')
var Daily = require('../models/daily.js')
var Weekly = require('../models/weekly.js')
var Monthly = require('../models/monthly.js')
var History = require('../models/history.js')
var OldPrimary = require('../models/oldPirmary.js');
var Balance = require('../models/schoolbalance.js')
var Credential = require('../models/credentials.js');
var Sender = require('../models/senderID.js')
var Payment = require('../models/payments.js')
var mongojs = require('mongojs');
var config = require('../config/key.js')
var router = express.Router();
var db = mongojs(config.database, ['users'])
var auth = function (req, res, next) {
    if (!req.user) {
        req.flash('info', 'You are logged out, Please Log In')
        res.redirect('/ES-admin')
    } else {
        next()
    }
}


router.get('/', function (req, res) {
    res.render('./admininstrator/login.jade')
})
router.get('/admin-signup', function (req, res) {
    res.render('./admininstrator/signup.jade')
})
router.get('/overdue', auth, function (req, res) {
    User.find({}, function (err, users) {
        res.render('./admininstrator/overdue.jade', {
            users: users,
            user: req.user
        })
    })

})
router.get('/users', auth, function (req, res) {
    User.find({}, function (err, users) {
        res.render('./admininstrator/users.jade', {
            users: users,
            user: req.user
        })
    })

})
router.get('/payments', auth, function (req, res) {
    Payment.find({}, function (err, payments) {
        res.render('./admininstrator/payments.jade', {
            payments: payments,
            user: req.user
        })
    })

})
router.get('/accountDetails/:id', auth, function (req, res) {
    Sender.find({userID:req.params.id},function(err,senders){
        Payment.find({userID:req.params.id}, function (err, payments) {
   
    Basic.find({ userID: req.params.id }, function (err, basics) {
        Weekly.find({ userID: req.params.id }, function (err, weekly) {
            Daily.find({ userID: req.params.id }, function (err, daily) {
                Monthly.find({ userID: req.params.id }, function (err, monthly) {
                    Customer.find({ userID: req.params.id }, function (err, customers) {
                        User.findById(req.params.id, function (err, use) {
                            res.render('./admininstrator/account.jade', {
                                use: use,
                                user: req.user,
                                customers: customers,
                                basics: basics,
                                daily: daily,
                                weekly: weekly,
                                monthly: monthly,
                                senders:senders,
                                payments:payments
                            })
                        })
                    })
                })
            })
            })
        })
    })
    })
})

//Disable

router.get('/basicDisable/:id',auth, function (req, res) {
    var basicCursor = Basic.find({ userID: req.params.id }).cursor();
    basicCursor.on('data', function (doc) {
        var query = {
            _id: doc.id
        }
        var data = {};
        data.account = false;
        Basic.update(query, data, function (err) {
            console.log('Success')
        })

    })
    req.flash('info', 'Reminders disabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/dailyDisable/:id', auth,function (req, res) {
    var dailyCursor = Daily.find({ userID: req.params.id }).cursor();
    dailyCursor.on('data', function (doc) {
        var query = {
            _id: doc.id
        }
        var data = {};
        data.account = false;
        Daily.update(query, data, function (err) {
            console.log('Success')
        })
    })
    req.flash('info', 'Reminders disabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/weeklyDisable/:id',auth, function (req, res) {
    var weeklyCursor = Weekly.find({ userID: req.params.id }).cursor();
    weeklyCursor.on('data', function (doc) {
        var query = {
            _id: doc.id
        }
        var data = {};
        data.account = false;
        Weekly.update(query, data, function (err) {
            console.log('Success')
        })
    })
    req.flash('info', 'Reminders disabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/monthlyDisable/:id',auth, function (req, res) {
    var monthlyCursor = Monthly.find({ userID: req.params.id }).cursor();
    monthlyCursor.on('data', function (doc) {
        var query = {
            _id: doc.id
        }
        var data = {};
        data.account = false;
        Monthly.update(query, data, function (err) {
            console.log('Success')
        })
    })
    req.flash('info', 'Reminders disabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})

//Enable
router.get('/basicEnable/:id',auth, function (req, res) {
    var basicCursor = Basic.find({ userID: req.params.id }).cursor();
    basicCursor.on('data', function (doc) {
        var query = {
            _id: doc.id
        }
        var data = {};
        data.account = true;
        Basic.update(query, data, function (err) {
            console.log('Success')
        })

    })
    req.flash('info', 'Reminders enabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/dailyEnable/:id', auth,function (req, res) {
    var dailyCursor = Daily.find({ userID: req.params.id }).cursor();
    dailyCursor.on('data', function (doc) {
        var query = {
            _id: doc.id
        }
        var data = {};
        data.account = true;
        Daily.update(query, data, function (err) {
            console.log('Success')
        })
    })
    req.flash('info', 'Reminders enabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/weeklyEnable/:id',auth, function (req, res) {
    var weeklyCursor = Weekly.find({ userID: req.params.id }).cursor();
    weeklyCursor.on('data', function (doc) {
        var query = {
            _id: doc.id
        }
        var data = {};
        data.account = true;
        Weekly.update(query, data, function (err) {
            console.log('Success')
        })
    })
    req.flash('info', 'Reminders enabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/monthlyEnable/:id',auth, function (req, res) {
    var monthlyCursor = Monthly.find({ userID: req.params.id }).cursor();
    monthlyCursor.on('data', function (doc) {
        var query = {
            _id: doc.id
        }
        var data = {};
        data.account = true;
        Monthly.update(query, data, function (err) {
            console.log('Success')
        })
    })
    req.flash('info', 'Reminders enabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})

//Delete

router.get('/basicDelete/:id',auth, function (req, res) {
    var basicCursor = Basic.find({ userID: req.params.id }).cursor();
    basicCursor.on('data', function (doc) {
      Basic.findByIdAndRemove(doc.id,function(err){
          console.log('Deleted')
      })
    })
    req.flash('info', 'Reminder(s) deleted successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/dailyDelete/:id',auth, function (req, res) {
    var dailyCursor = Daily.find({ userID: req.params.id }).cursor();
    dailyCursor.on('data', function (doc) {
        Daily.findByIdAndRemove(doc.id,function(err){
            console.log('Deleted')
        })
    })
    req.flash('info', 'Reminders enabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/weeklyDelete/:id',auth, function (req, res) {
    var weeklyCursor = Weekly.find({ userID: req.params.id }).cursor();
    weeklyCursor.on('data', function (doc) {
        Weekly.findByIdAndRemove(doc.id,function(err){
            console.log('Deleted')
        })
    })
    req.flash('info', 'Reminders enabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/monthlyDelete/:id',auth, function (req, res) {
    var monthlyCursor = Monthly.find({ userID: req.params.id }).cursor();
    monthlyCursor.on('data', function (doc) {
        Monthly.findByIdAndRemove(doc.id,function(err){

            console.log('Deleted')
        })
    })
    req.flash('info', 'Reminders enabled successfully')
    res.redirect('/ES-admin/accountDetails/' + req.params.id)
})
router.get('/deleteAccount/:id',auth,function(req,res){
    var basicCursor = Basic.find({ userID: req.params.id }).cursor();
    basicCursor.on('data', function (doc) {
      Basic.findByIdAndRemove(doc.id,function(err){
          console.log('Deleted')
      })
    })
    var dailyCursor = Daily.find({ userID: req.params.id }).cursor();
    dailyCursor.on('data', function (doc) {
        Daily.findByIdAndRemove(doc.id,function(err){
            console.log('Deleted')
        })
    })
    var weeklyCursor = Weekly.find({ userID: req.params.id }).cursor();
    weeklyCursor.on('data', function (doc) {
        Weekly.findByIdAndRemove(doc.id,function(err){
            console.log('Deleted')
        })
    })
    var monthlyCursor = Monthly.find({ userID: req.params.id }).cursor();
    monthlyCursor.on('data', function (doc) {
        Monthly.findByIdAndRemove(doc.id,function(err){

            console.log('Deleted')
        })
    })
    User.findByIdAndRemove(req.params.id,function(err){
        req.flash('info','Account Delete Successfully')
        res.redirect('/ES-admin/dashboard')

    })
 



})
router.get('/dashboard', auth, function (req, res) {
    User.find({}, function (err, users) {
        User.distinct('messages', function (err, messages) {
            var message = 0;
            for (var i = 0; i < messages.length; i++) {
                message += messages[i];
            }


            Payment.distinct('amount', function (err, payments) {
                Customer.find({}, function (err, customers) {
                    console.log(payments)
                    var total = 0;
                    for (var i = 0; i < payments.length; i++) {
                        total += payments[i];
                    }
                    console.log(total)
                    var formatter = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'KES',
                    });

                    var final = formatter.format(total)
                    res.render('./admininstrator/dashboard.jade', {
                        user: req.user,
                        users: users,
                        final: final,
                        message: message,
                        customers: customers
                    })
                })
            })
        })
    })
});
router.get('/users', auth, function (req, res) {
    User.find({}, function (err, users) {
        res.render('./admininstrator/users.jade', {
            users: users,
            user: req.user
        })
    })

})
router.get('/payments', auth, function (req, res) {
    Payment.find({}, function (err, payments) {
        res.render('./admininstrator/payments.jade',
            {
                payments: payments,
                user: req.user
            })
    })

})
router.post("/admin-register", function (req, res) {
    if (req.body.password !== req.body.password2) {
        req.flash('danger', 'Passwords do not match')
        res.redirect('/ES-admin/admin-signup')
    }
    else {
        var data = new Admin();
        data.fullname = req.body.fullname;
        data.username = req.body.username;
        data.email = req.body.email;
        data.password = req.body.password;
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(data.password, salt, function (err, hash) {
                if (err) {
                    console.log(err);
                } else {
                    data.password = hash;
                    data.save(function (err) {
                        if (err) {
                            console.log(err)
                        } else {

                            console.log("New user has been added");
                            req.flash('info', 'Thank You, Please Log In.')
                            res.redirect('/ES-admin')


                        }
                    })
                }
            })
        })

    }
})

router.post('/admin-login',
    passport.authenticate('superAdmin', {
        successRedirect: '/ES-admin/dashboard',
        failureRedirect: '/ES-admin',
        failureFlash: true,
        session: true

    })
);
router.get('/dashboard-logout', function (req, res) {
    req.logout();
    req.flash('info', 'You are Log Out, Please Log In.');
    res.redirect('/ES-admin')
});

module.exports = router;