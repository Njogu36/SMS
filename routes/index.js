var express = require('express');
var bcrypt = require('bcryptjs');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var passport = require('passport');
var router = express.Router();
var User = require('../models/user.js');
var Customer = require('../models/customer.js')
var Basic = require('../models/basic.js')
var Daily = require('../models/daily.js')
var Weekly = require('../models/weekly.js')
var Monthly = require('../models/monthly.js')
var History = require('../models/history.js')
var Group = require('../models/groups.js')
var OldPrimary = require('../models/oldPirmary.js');
var Balance = require('../models/schoolbalance.js')
var Credential = require('../models/credentials.js');
var Template = require('../models/templates.js');
var Sender = require('../models/senderID.js');
var Payment = require('../models/payments.js')
var mongojs = require('mongojs');
var config = require('../config/key.js')
var querystring = require('querystring');
var csv = require('fast-csv');
var https = require('https');
var mongoose = require('mongoose')

var connect = require('connect')
var errorhandler = require('errorhandler')
var notifier = require('node-notifier')

var app = connect()
var date = new Date();
    var hour = ('0' + date.getHours()).slice(-2);
    var min = ('0' + date.getMinutes()).slice(-2);
    var sec = date.getSeconds();
    var year = date.getFullYear();

if (process.env.NODE_ENV === 'development') {
    // only use in development
    app.use(errorhandler({ log: errorNotification }))
}

function errorNotification(err, str, req) {
    var title = 'Error in ' + req.method + ' ' + req.url

    notifier.notify({
        title: title,
        message: str
    })
}
// Initialize the SDK

var db = mongojs(config.database, ['users'])
var auth = function (req, res, next) {
    if (!req.user) {
        req.flash('info', 'You are logged out, Please Log In')
        res.redirect('/login')
    } else {
        next()
    }
}


router.get('/hide', function (req, res) {
    Cohort.find({}, function (err, cohorts) {
        if (err) {
            res.redirect('/error')
        }
        res.render('index.jade', {
            cohorts: cohorts
        })
    })

})
router.get('/', function (req, res) {
    res.render('home.jade',{
        year:year
    })
})
router.get('/accountTransactions',auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Payment.find({userID:req.user.id},function(err,payments){
        res.render('accountTransactions.jade',{
            payments:payments,
            user:req.user,
            year:year,
            amount:formatter.format(req.user.amount)
        })
    })
    
})
router.get('/paymentMethods',auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Payment.find({userID:req.user.id},function(err,payments){
        res.render('paymentMethod.jade',{
            payments:payments,
            user:req.user,
            year:year,
            amount:formatter.format(req.user.amount)
        })
    })
    
})


router.get('/login', function (req, res) {
    res.render('login2.jade')
})
router.get('/documentation', function (req, res) {
    res.render('documentation2.jade',{
        year:year,
    })
})
router.get('/templates', function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Template.find({ userID: req.user.id }, function (err, templates) {
        if (err) {
            res.redirect('/error')
        }
        res.render('templates.jade', {
            user: req.user,
            templates: templates,
            year:year,
            amount:formatter.format(req.user.amount)
        })
    })

})
router.get('/getTemplate/:name/:id', function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Template.findOne({ name: req.params.name, userID: req.params.id }, function (err, template) {
        if (err) {
            res.redirect('/error')
        }
        res.send({ success: true, message: template.message })
    })

})
router.get('/sendOne/:id/:id2', function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })

    Template.find({ userID: req.user.id }, function (err, templates) {
        if (err) {
            res.redirect('/error')
        }
        Sender.find({ userID: req.user.id }, function (err, senders) {
            if (err) {
                res.redirect('/error')
            }
            Group.findById(req.params.id, function (err, group) {
                if (err) {
                    res.redirect('/error')
                }
                Customer.findById(req.params.id2, function (err, customer) {
                    if (err) {
                        res.redirect('/error')
                    }
                    res.render('sendOne.jade', {
                        group: group,
                        customer: customer,
                        user: req.user,
                        senders: senders,
                        templates: templates,
                        amount:formatter.format(req.user.amount),
                        year:year,


                    })
                })
            })
        })
    })

})
router.get('/sendBulk', function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Template.find({ userID: req.user.id }, function (err, templates) {
        if (err) {
            res.redirect('/error')
        }

        Sender.find({ userID: req.user.id }, function (err, senders) {
            if (err) {
                res.redirect('/error')
            }
            Group.find({ userID: req.user.id }, function (err, groups) {
                if (err) {
                    res.redirect('/error')
                }
                res.render('sendBulk.jade', {
                    groups: groups,

                    user: req.user,
                    senders: senders,
                    templates: templates,
                    year:year,
                    amount:formatter.format(req.user.amount)


                })

            })
        })
    })
})
router.get('/deleteTemplate/:id', function (req, res) {
    Template.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            res.redirect('/error')
        }
        req.flash('danger', 'Template has been deleted')
        res.redirect('/templates')
    })
})
router.post('/addTemplate', auth, function (req, res) {
    Template.findOne({ name: req.body.name, message: req.body.message, userID: req.user.id }, function (err, template) {
        if (err) {
            res.redirect('/error')
        }
        if (template) {
            req.flash('danger', 'SMS Template already exists')
            res.redirect('/templates')
        }
        else {
            var data = new Template();
            data.name = req.body.name;
            data.message = req.body.message;
            data.userID = req.user.id;
            data.save(function (err) {
                if (err) {
                    res.redirect('/error')
                }
                req.flash('info', 'SMS Template has been saved')
                res.redirect('/templates')
            })
        }
    })
})
router.get('/oldCurriculum', function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    OldPrimary.find({ userID: req.user.id }, function (err, primary) {
        if (err) {
            res.redirect('/error')
        }
        res.render('oldCurriculum.jade', {
            primary: primary,
            user: req.user,
            year:year,
            amount:formatter.format(req.user.amount)
        })
    })

})
router.get('/groups', function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    formatter.format(req.user.amount)
    Group.find({ userID: req.user.id }, function (err, groups) {
        if (err) {
            res.redirect('/error')
        }
        res.render('groups.jade', {
            groups: groups,
            user: req.user,
            year:year,
            amount:formatter.format(req.user.amount)
        })
    })

})
router.post('/addGroup', function (req, res) {
    
    Group.findOne({ name: req.body.group }, function (err, group) {
        if (err) {
            res.redirect('/error')
        }
        if (group) {
            req.flash("danger", 'The group name already exists')
            res.redirect('/groups')
        }
        else {
            var data = new Group();
            data.name = req.body.group;
            data.userID = req.user.id;
            data.count = 0
            data.save(function (err) {
                if (err) {
                    res.redirect('/error')
                }
                req.flash("info", 'Group has been saved')
                res.redirect('/groups')
            })
        }
    })

})
router.get('/newCurriculum', function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    res.render('newCurriculum.jade',
    {
        amount:formatter.format(req.user.amount),
        year:year,
        user:req.user
    })
})
router.get('/oldCurriculumData', function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Sender.find({ userID: req.user.id }, function (err, senders) {
        if (err) {
            res.redirect('/error')
        }
        OldPrimary.find({ userID: req.user.id }, function (err, primary) {
            if (err) {
                res.redirect('/error')
            }
            res.render('oldCurriculumData.jade', {
                primary: primary,
                user: req.user,
                year:year,
                senders: senders,
                amount:formatter.format(req.user.amount)
            })
        })
    })


})
router.get('/signup', function (req, res) {
    res.render('signup2.jade')
})
router.get('/payments', function (req, res) {
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    res.render('payment.jade',
        {
            user: req.user,
            year:year,
            amount: formatter.format(req.user.amount)
        })
})
router.get('/share/:company/:group', function (req, res) {

    Group.findOne({ name: req.params.group }, function (err, group) {
        if (err) {
            res.redirect('/error')
        }
        if (!group) {
            console.log('Group')
        }
        else {
            User.findOne({ companyname: req.params.company }, function (err, user) {
                if (err) {
                    res.redirect('/error')
                }
                res.render('share.jade',
                    {
                        user: user,
                        year:year,
                        group: group

                    })
            })
        }

    })


})
router.get('/addCustomer/:id', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Group.findById(req.params.id, function (err, group) {
        if (err) {
            res.redirect('/error')
        }
        res.render('addCustomer.jade', {
            group: group,
            user: req.user,
            year:year,
            amount: formatter.format(req.user.amount)
        })
    })

})
router.get('/importCustomer/:id', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Group.findById(req.params.id, function (err, group) {
        if (err) {
            res.redirect('/error')
        }
        res.render('import.jade', {
            group: group,
            user: req.user,
            year:year,
            amount: formatter.format(req.user.amount)
        })
    })

})
router.get('/error', auth, function (req, res) {
    res.render('error.jade', {

        user: req.user
    })


})
router.get('/editCustomer/:id/:id2', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Group.findById(req.params.id2, function (err, group) {
        if (err) {
            res.redirect('/error')
        }
        Customer.findById(req.params.id, function (err, customer) {
            if (err) {
                res.redirect('/error')
            }
            res.render('editCustomer.jade', {
                customer: customer,
                group: group,
                user: req.user,
                year:year,
                amount: formatter.format(req.user.amount)
            })
        })
    })
})
router.get('/credentials', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Sender.find({ userID: req.user.id }, function (err, senders) {
        if (err) {
            res.redirect('/error')
        }
        res.render('credentials.jade',
            {
                user: req.user,
                senders: senders,
                year:year,
                amount:formatter.format(req.user.amount)
            })
    })

})
router.get('/pendingReminders', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Basic.find({userID:req.user.id},function(err,basics){
        Daily.find({userID:req.user.id},function(err,dailies){
            Weekly.find({userID:req.user.id},function(err,weeks){
                Monthly.find({userID:req.user.id},function(err,months){
                    res.render('pending.jade',
            {
                user: req.user,
                basics:basics,
                dailies:dailies,
                weeks:weeks,
                year:year,
                months:months,
                amount: formatter.format(req.user.amount)


            })

                })
            })
        })
    })
   

})

router.get('/deleteSenderID/:id', function (req, res) {
    Sender.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            res.redirect('/error')
        }
        req.flash('danger', 'Sender ID has been deleted')
        res.redirect('/credentials')
    })
})
router.post('/addSenderID', function (req, res) {
    Sender.findOne({ name: req.body.senderID }, function (err, sender) {
        if (err) {
            res.redirect('/error')
        }
        if (sender) {
            req.flash('danger', 'Sender ID already exists')
            res.redirect('/credentials')
        }
        else {
            var data = new Sender();
            data.name = req.body.senderID;
            data.userID = req.user.id;
            data.save(function (err) {
                if (err) {
                    res.redirect('/error')
                }
                req.flash('info', 'Sender ID has been saved')
                res.redirect('/credentials')
            })
        }

    })
})
router.get('/history', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    History.find({ userID: req.user.id }, function (err, histories) {
        if (err) {
            res.redirect('/error')
        }
        res.render('history.jade',
            {
                user: req.user,
                histories: histories,
                amount:formatter.format(req.user.amount)
            })
    })

})
router.get('/school-exam', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    res.render('school-exam.jade',
    {
        user:req.user,
        year:year,
        amount:formatter.format(req.user.amount)
    })
})
router.get('/school-balance', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Balance.find({ userID: req.user.id }, function (err, balance) {
        if (err) {
            res.redirect('/error')
        }
        res.render('school-balance.jade', {
            balance: balance,
            user: req.user,
            year:year,
            amount:formatter.format(req.user.amount)
        })
    })

})
router.get('/schoolBalanceData', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    
    Sender.find({ userID: req.user.id }, function (err, senders) {
        if (err) {
            res.redirect('/error')
        }
        Balance.find({ userID: req.user.id }, function (err, balance) {
            if (err) {
                res.redirect('/error')
            }
            res.render('schoolBalanceData.jade', {
                balance: balance,
                user: req.user,
                senders: senders, 
                year:year,
                amount:formatter.format(req.user.amount)
            })
        })
    })


})
router.get('/recurrence', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    formatter.format(req.user.amount)
    function call() {
        const credentials = {
            apiKey: req.user.apikeySMS,
            username: req.user.usernameSMS
        }

        // Initialize the SDK
        const AfricasTalking = require('africastalking')(credentials);
        // Get the application service
        const app = AfricasTalking.APPLICATION;

        function getApplicationData() {
            // Fetch the application data
            app.fetchApplicationData()
                .then((data) => {
                    Group.find({userID:req.user.id},function(err,groups){
                        Template.find({userID:req.user.id},function(err,templates){
                    Sender.find({userID:req.user.id},function(err,senders){

                  
                    Customer.find({ userID: req.user.id }, function (err, customers) {
                        res.render('recurrence.jade', {
                            customers: customers,
                            amount: customers.length,
                            balance: data.UserData.balance,
                            username: app.options.username,
                            user: req.user,
                            templates:templates,
                            groups:groups,
                            senders:senders,
                            year:year,
                            final: 0,
                            amount:formatter.format(req.user.amount)
                        })

                    })
                })
                            
                })
            })

                }).catch((error) => {
                    console.log(error)
                    Group.find({userID:req.user.id},function(err,groups){
                        Template.find({userID:req.user.id},function(err,templates){
                            Sender.find({userID:req.user.id},function(err,senders){

                    Customer.find({ userID: req.user.id }, function (err, customers) {
                        res.render('recurrence.jade', {
                            customers: customers,
                            amount: customers.length,
                            final: 5,
                            user: req.user,
                            error: error,
                            year:year,
                            groups:groups,
                            templates:templates,
                            senders:senders,
                            amount:formatter.format(req.user.amount)
                        })
                    })
                    })
                })
            })
                });
        }
        getApplicationData();
    }

    if (req.user.usernameSMS === undefined && req.user.senderidSMS === undefined && req.user.apikeySMS === undefined) {
        Group.find({userID:req.user.id},function(err,groups){
            Template.find({userID:req.user.id},function(err,templates){
                Sender.find({userID:req.user.id},function(err,senders){

        Customer.find({ userID: req.user.id }, function (err, customers) {
            if (err) {
                res.redirect('/error')
            }
            res.render('recurrence.jade', {
                customers: customers,
                amount: customers.length,
                final: 5,
                user: req.user,
                year:year,
                templates:templates,
                groups:groups,
                senders:senders,
                amount:formatter.format(req.user.amount)
            })

        })})})})
    }
    else {
        call()

    }

})

router.get('/groupCustomer/:id', auth, function (req, res) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2
    })
    Template.find({ userID: req.user.id }, function (err, templates) {
        if (err) {
            res.redirect('/error')
        }
        Sender.find({ userID: req.user.id }, function (err, senders) {
            if (err) {
                res.redirect('/error')
            }
            Group.findById(req.params.id, function (err, group) {
                if (err) {
                    res.redirect('/error')
                }
                Customer.find({ group: group.name, userID: req.user.id }, function (err, customers) {
                    if (err) {
                        res.redirect('/error')
                    }
                    res.render('groupCustomers.jade', {
                        group: group,
                        customers: customers,
                        user: req.user,
                        senders: senders,
                        year:year,
                        templates: templates,
                        amount:formatter.format(req.user.amount)


                    })
                })
            })
        })
    })


});
router.get('/dashboard', auth, function (req, res) {





    function Call() {
        const credentials = {
            apiKey: req.user.apikeySMS,
            username: req.user.usernameSMS
        }



        // Initialize the SDK
        const AfricasTalking = require('africastalking')(credentials);
        // Get the application service
        const app = AfricasTalking.APPLICATION;
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2
        })
        formatter.format(req.user.amount)
        function getApplicationData() {
            // Fetch the application data
            app.fetchApplicationData()
                .then((data) => {
                    db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $set: { atAmount: data.UserData.balance } }, function (err) {

                    })
                    Group.find({ userID: req.user.id }, function (err, groups) {
                        if (err) {
                            res.redirect('/error')
                        }
                        Customer.find({ userID: req.user.id }, function (err, customers) {
                            if (err) {
                                res.redirect('/error')
                            }
                            res.render('dashboard.jade', {
                                customers: customers,
                                amount: formatter.format(req.user.amount),
                                balance: data.UserData.balance,
                                username: app.options.username,
                                final: 0,
                                year:year,
                                user: req.user,
                                groups: groups
                            })

                        })
                    })

                }).catch((error) => {
                    Group.find({ userID: req.user.id }, function (err, groups) {
                        if (err) {
                            res.redirect('/error')
                        }
                        Customer.find({ userID: req.user.id }, function (err, customers) {
                            if (err) {
                                res.redirect('/error')
                            }
                            res.render('dashboard.jade', {
                                customers: customers,
                                amount: formatter.format(req.user.amount),
                                error: error,
                                final: 5,
                                year:year,
                                user: req.user,
                                groups: groups
                            })

                        })
                    });
                });
        }

        getApplicationData();
    }
    if (req.user.usernameSMS === undefined && req.user.senderidSMS === undefined && req.user.apikeySMS === undefined) {
        Group.find({ userID: req.user.id }, function (err, groups) {
            if (err) {
                res.redirect('/error')
            }


            Customer.find({ userID: req.user.id }, function (err, customers) {
                if (err) {
                    res.redirect('/error')
                }
                res.render('dashboard.jade', {
                    customers: customers,
                    amount: customers.length,
                    final: 5,
                    year:year,
                    user: req.user,
                    groups: groups
                })

            })
        })
    }

    else {
        Call()
        Group.find({ userID: req.user.id }, function (err, groups) {
            if (err) {
                res.redirect('/error')
            }

            Customer.find({ userID: req.user.id }, function (err, customers) {
                if (err) {
                    res.redirect('/error')
                }
                if (customers.length > 100) {
                    if (req.user.amount === 0) {
                        var query = {
                            _id: req.user.id
                        }
                        var data = {};
                        data.pay = true;
                        User.update(query, data, function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            console.log('Updated')
                        })
                    }
                    else {
                        var query = {
                            _id: req.user.id
                        }
                        var data = {};
                        data.pay = true;
                        User.update(query, data, function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            console.log('Updated')
                        })
                    }

                }
                else {
                    var query = {
                        _id: req.user.id
                    }
                    var data = {};
                    data.pay = false;
                    data.duePayment = '';
                    User.update(query, data, function (err) {
                        if (err) {
                            res.redirect('/error')
                        }
                        console.log('Updated')
                    })
                }
            })
        })
    }





});


/*
router.post('/user-register', function (req, res) {
    req.checkBody('firstname', 'First name is required').notEmpty();
    req.checkBody('lastname', 'Last name is required').notEmpty();
    req.checkBody('phone', 'Phone Number is required').notEmpty();

    var errors = req.validationErrors();
    if (errors) {

        User.find({}, function (err, users) {
            res.render('dashboard.jade', {
                users: users,
                errors: errors,
                amount: users.length
            })

        })
    } else {
        var data = new User();
        data.firstname = req.body.firstname;
        data.lastname = req.body.lastname;
        data.phone = req.body.phone;
        data.save(function (err) {

            console.log('New Client has been added.');
            req.flash('info', 'You have been added successfully.')
            res.redirect('/dashboard')
        })
    }
})*/
router.post('/importschoolBalance', function (request, response, next) {
    var students = request.body;

    students.forEach(item => {
        if (item.PHONENUMBER === undefined && item.ADM === undefined && item.NAME === undefined && item.CLASS === undefined && item.BALANCE === undefined) {
            console.log('Hello')
        }
        else {
            var phone = item.PHONENUMBER

            if (phone.toString().length === 12) {
                Balance.findOne({ phone: item.PHONENUMBER, fullname: item.NAME, class: item.CLASS, admissionNo: item.ADM, term: item.TERM, amount: item.BALANCE }, function (err, old) {
                    if (old) {
                        console.log('Failed! Duplication')
                    }
                    else {
                        var data = new Balance();
                        data.phone = item.PHONENUMBER;
                        data.admissionNo = item.ADM;
                        data.fullname = item.NAME;
                        data.class = item.CLASS;
                        data.term = item.TERM;
                        data.amount = item.BALANCE

                        data.userID = request.user.id
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            console.log('Data added')

                        })
                    }
                })




            }
            else {
                console.log('Invalid phone number error')
            }

        }



    });


    response.send({ success: true })




});
router.post('/updatePayment', function (req, res) {
    var data3 = req.body;
    var amount = data3.data.amount;

    var finalAmount = req.user.amount - amount;
    db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $set: { amount: finalAmount } }, function (err) {
        if (err) {
            res.send({ success: false })
        }
        else {
            var dat = new Payment();
            dat.fullname = '';
            dat.email = req.user.email;
            dat.createdOn = data3.data.createdAt;
            dat.amount = data3.data.amount;
            dat.customerID = data3.data.customerId;
            dat.currency = data3.data.currency;
            dat.userID = req.user.id
            dat.status = data3.status
            dat.flwRef = data3.data.flwMeta.flwRef
            dat.save(function (err) {
                res.send({ success: true })
            })
        }


    })
})
router.post('/importoldPrimary', function (request, response, next) {


    var students = request.body;

    students.forEach(item => {
        if (item.PHONENUMBER === undefined && item.ADM === undefined && item.NAME === undefined && item.CLASS === undefined) {
            console.log('Hello')
        }
        else {
            var phone = item.PHONENUMBER

            if (phone.toString().length === 12) {
                OldPrimary.findOne({ fullname: item.NAME, class: item.CLASS, admissionNo: item.ADM, term: item.TERM, position: item.POSITION }, function (err, old) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (old) {
                        console.log('Failed! Duplication')
                    }
                    else {
                        var data = new OldPrimary();
                        data.phone = item.PHONENUMBER;
                        data.admissionNo = item.ADM;
                        data.fullname = item.NAME;
                        data.class = item.CLASS;
                        data.term = item.TERM;
                        data.Mathematics = item.MATH;
                        data.English = item.ENG;
                        data.Kiswahili = item.KISW;
                        data.Science = item.SCI;
                        data.ssre = item.SSRE

                        data.Total = item.TOTAL;
                        data.position = item.POSITION
                        data.userID = request.user.id
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            console.log('Data added')

                        })
                    }
                })




            }
            else {
                console.log('Invalid phone number error')
            }

        }



    });


    response.send({ success: true })



})
// POST ---------
router.post('/importCustomer/:id', function (request, response, next) {
    Group.findById(request.params.id, function (err, group) {
        if (err) {
            res.redirect('/error')
        }

        var customers = request.body;
        console.log(customers)
        customers.forEach(item => {
            if (item.firstname === undefined && item.lastname === undefined && item.phone === undefined) {
                console.log('Hello')
            }
            else {
                var phone = item.phone;

                if (phone.toString().length === 12) {
                    Customer.findOne({ firstname: item.firstname, group: group.name, lastname: item.lastname, phone: item.phone, userID: request.user.id }, function (err, customer) {
                        if (customer) {
                            console.log('Duplication error')
                        }
                        else {
                            var data = new Customer();
                            data.firstname = item.firstname;
                            data.lastname = item.lastname;
                            data.phone = item.phone;
                            data.userID = request.user.id;
                            data.group = group.name
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                db.groups.update({ _id: mongojs.ObjectId(request.params.id) }, { $inc: { count: 1 } }, function (err) {
                                    if (err) {
                                        res.redirect('/error')
                                    }
                                })
                                console.log('added')
                            })
                        }
                    })

                }
                else {
                    console.log('Invalid phone number error')
                }

            }



        });
        response.send({ success: true })


    })



})
router.post('/testSender', auth, function (req, res) {
    const credentials = {
        apiKey: req.user.apikeySMS,
        username: req.user.usernameSMS,
    }
    const AfricasTalking = require('africastalking')(credentials);

    // Get the SMS service
    const sms = AfricasTalking.SMS;
    function sendMessage() {

        const options = {
            // Set the numbers you want to send to in international format
            to: '+' + req.body.phone,
            // Set your message
            message: 'Success',
            // Set your shortCode or senderId
            from: req.body.sender
        }

        // That’s it, hit send and we’ll take care of the rest
        sms.send(options)
            .then((response) => {
                console.log(response)
                if (response.SMSMessageData.Message === 'InvalidSenderId') {
                    req.flash('danger', response.SMSMessageData.Message)
                    res.redirect('/credentials')

                }
                else if (response.SMSMessageData.Message === 'Sent to 0/1 Total Cost: 0') {
                    req.flash('info', 'Success')
                    res.redirect('/credentials')

                }
                else {
                    req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                    res.redirect('/credentials')
                }


            })
            .catch((error) => {
                console.log(error);
                req.flash('danger', error)
                res.redirect('/credentials')


            });


    }

    sendMessage();

})
var date = new Date();


var hour = ('0' + date.getHours()).slice(-2);
var min = ('0' + date.getMinutes()).slice(-2);
var sec = date.getSeconds();
var year = date.getFullYear();
var day = ('0' + date.getDate()).slice(-2);
var month = ('0' + (date.getMonth() + 1)).slice(-2);
//2019-11-14/04:56
var timeHistory = year + "-" + month + "-" + day + "/" + hour + ":" + min;
router.post('/sendone/:id/:id2', auth, function (req, res) {
    Template.findOne({ name: req.body.template, userID: req.user.id }, function (err, template) {


        if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
            req.flash('danger', 'Kindly add your africanstalking credentials')
            res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)
        }
        else if (req.body.template !== '' && req.body.message !== '') {
            req.flash('danger', 'Error, kindly choose one message option')
            res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)
        }
       
        else if (req.body.template === '' && req.body.message === '') {
            req.flash('danger', 'Error, kindly choose one message option')
            res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)
        }
        else {

            const credentials = {
                apiKey: req.user.apikeySMS,
                username: req.user.usernameSMS,
            }
            const AfricasTalking = require('africastalking')(credentials);

            // Get the SMS service
            const sms = AfricasTalking.SMS;
            if (req.body.template !== '') {

                if (req.body.sender === '') {
                    function sendMessage() {

                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + req.body.phone,
                            // Set your message
                            message: template.message,
                            // Set your shortCode or senderId

                        }

                        // That’s it, hit send and we’ll take care of the rest
                        sms.send(options)
                            .then((response) => {

                                if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    var data = new History();
                                    data.userID = req.user.id;
                                    data.phone = req.body.phone;
                                    data.createdOn = new Date();
                                    data.sendOn = timeHistory;
                                    data.senderID = ''
                                    data.typeMessage = 'Individual';
                                    data.message = template.message;
                                    data.save(function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        console.log('Saved to history')
                                    })
                                    db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                    })
                                    req.flash('info', response.SMSMessageData.Message)

                                    res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)

                                }
                                else {
                                    req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                    res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)

                                }
                                console.log(response)

                            })
                            .catch((error) => {
                                console.log(error)
                                req.flash('danger', error)
                                res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)


                            });



                    }

                    sendMessage();
                }
                else {
                    function sendMessage() {

                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + req.body.phone,
                            // Set your message
                            message: template.message,
                            // Set your shortCode or senderId
                            from: req.body.sender
                        }

                        // That’s it, hit send and we’ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                console.log(response)
                                if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                    req.flash('danger', response.SMSMessageData.Message)
                                    res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)

                                }
                                else if (response.SMSMessageData.Message === 'Sent to 0/1 Total Cost: 0') {
                                    db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                    })
                                    var data = new History();
                                    data.userID = req.user.id;
                                    data.phone = req.body.phone;
                                    data.senderID = req.body.sender
                                    data.createdOn = new Date();
                                    data.sendOn = timeHistory;
                                    data.typeMessage = 'Individual';
                                    data.message = template.message;
                                    data.save(function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        console.log('Saved to history')
                                    })
                                }
                                else {
                                    req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                    res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)
                                }


                            })
                            .catch((error) => {
                                console.log(error);
                                req.flash('danger', error)
                                res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)


                            });


                    }

                    sendMessage();
                }
            }
            else if (req.body.message !== '') {
                if (req.body.sender === '') {
                    function sendMessage() {

                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + req.body.phone,
                            // Set your message
                            message: req.body.message,
                            // Set your shortCode or senderId

                        }

                        // That’s it, hit send and we’ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                console.log(response)
                                if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    var data = new History();
                                    data.userID = req.user.id;
                                    data.phone = req.body.phone;
                                    data.createdOn = new Date();
                                    data.sendOn = timeHistory;
                                    data.senderID = ''
                                    data.typeMessage = 'Individual';
                                    data.message = req.body.message;
                                    data.save(function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        console.log('Saved to history')
                                    })
                                    db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                    })
                                    req.flash('info', response.SMSMessageData.Message)

                                    res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)

                                }
                                else {
                                    req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                    res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)

                                }

                            })
                            .catch((error) => {
                                console.log(error)
                                req.flash('danger', error)
                                res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)


                            });



                    }

                    sendMessage();
                }
                else {
                    function sendMessage() {

                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + req.body.phone,
                            // Set your message
                            message: req.body.message,
                            // Set your shortCode or senderId
                            from: req.body.sender
                        }

                        // That’s it, hit send and we’ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                console.log(response)
                                if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                    req.flash('danger', response.SMSMessageData.Message)
                                    res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)

                                }
                                else if (response.SMSMessageData.Message === 'Sent to 0/1 Total Cost: 0') {
                                    db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                    })
                                    var data = new History();
                                    data.userID = req.user.id;
                                    data.phone = req.body.phone;
                                    data.senderID = req.body.sender
                                    data.createdOn = new Date();
                                    data.sendOn = timeHistory;
                                    data.typeMessage = 'Individual';
                                    data.message = req.body.message;
                                    data.save(function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        console.log('Saved to history')
                                    })
                                }
                                else {
                                    req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                    res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)
                                }


                            })
                            .catch((error) => {
                                console.log(error);
                                req.flash('danger', error)
                                res.redirect('/sendOne/' + req.params.id + '/' + req.params.id2)


                            });


                    }

                    sendMessage();
                }
            }







        }
    })
})
//test-
router.post('/sendschoolBalance', auth, function (req, res) {
    let hist = 0
    if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
        req.flash('danger', 'Kindly add your africanstalking credentials')
        res.redirect('/schoolBalanceData')
    }


    else {
        var balanceCursor = Balance.find({ userID: req.user.id }).cursor();
        balanceCursor.on('data', function (doc) {
            const credentials = {
                apiKey: req.user.apikeySMS,
                username: req.user.usernameSMS,
            }
            const AfricasTalking = require('africastalking')(credentials);

            // Get the SMS service
            const sms = AfricasTalking.SMS;
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 2
            })
            function sendMessage() {
                if (req.body.sender === '') {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: "Dear parent, this is your child's fee balance for " + doc.term + '\n' + doc.fullname + '\n' + 'Admission Number - ' + doc.admissionNo + '\n' + 'Class - ' + doc.class + '\n' + 'Amount - ' + formatter.format(doc.amount) + '\n' + 'Thank you. Powered By Elite-SMS.',
                        // Set your shortCode or senderId

                    }

                    // That’s it, hit send and we’ll take care of the rest
                    sms.send(options)
                        .then((response) => {

                            if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                    if (err) {
                                        res.redirect('/error')
                                    }
                                })
                                console.log(response)
                                req.flash('info', response.SMSMessageData.Message)
                                res.redirect('/schoolBalanceData')

                                if (hist === 0) {
                                    var data = new History();
                                    data.userID = req.user.id;
                                    data.phone = doc.phone;
                                    data.createdOn = new Date();
                                    data.sendOn = timeHistory;
                                    data.typeMessage = 'Fee Balances';
                                    data.message = '....';
                                    data.save(function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        console.log('Saved to history')
                                        hist = 2
                                    })
                                }
                                setTimeout(function () {
                                    Balance.findByIdAndRemove(doc.id, function (err, customers) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        console.log('Deleted')
                                    })
                                }, 300)

                            }
                            else {
                                console.log(response)
                                req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                res.redirect('/schoolBalanceData')
                            }


                        })
                        .catch((error) => {
                            req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                            res.redirect('/schoolBalanceData')


                        });
                }
                else {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: "Dear parent, this is your child's fee balance for " + doc.term + '\n' + doc.fullname + '\n' + 'Admission Number - ' + doc.admissionNo + '\n' + 'Class - ' + doc.class + '\n' + 'Amount - ' + formatter.format(doc.amount) + '\n' + 'Thank you. Powered By Elite-SMS.',
                        // Set your shortCode or senderId
                        from: req.body.sender
                    }

                    // That’s it, hit send and we’ll take care of the rest
                    sms.send(options)
                        .then((response) => {
                            if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                req.flash('danger', response.SMSMessageData.Message)
                                res.redirect('/schoolBalanceData')
                                console.log(response)

                            }
                            else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                    if (err) {
                                        res.redirect('/error')
                                    }
                                })
                                if (hist === 0) {
                                    var data = new History();
                                    data.userID = req.user.id;
                                    data.phone = doc.phone;
                                    data.createdOn = new Date();
                                    data.sendOn = timeHistory;
                                    data.typeMessage = 'Fee Balances';
                                    data.message = '....';
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        hist = 2
                                    })
                                }
                                setTimeout(function () {
                                    Balance.findByIdAndRemove(doc.id, function (err, customers) {
                                        console.log('Deleted')
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                    })
                                }, 300)
                            }
                            else {
                                req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                res.redirect('/schoolBalanceData')

                            }


                        })
                        .catch((error) => {
                            console.log(error);
                            req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                            res.redirect('/schoolBalanceData')

                        });

                }

            }

            sendMessage();


        })
    }
})
router.post('/sendoldPrimary', auth, function (req, res) {
    let hist = 0
    if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
        req.flash('danger', 'Kindly add your africanstalking credentials')
        res.redirect('/oldCurriculumData')
    }
    else {
        var oldPrimaryCursor = OldPrimary.find({ userID: req.user.id }).cursor();
        oldPrimaryCursor.on('data', function (doc) {
            const credentials = {
                apiKey: req.user.apikeySMS,
                username: req.user.usernameSMS,
            }
            const AfricasTalking = require('africastalking')(credentials);

            // Get the SMS service
            const sms = AfricasTalking.SMS;

            function sendMessage() {
                if (req.body.sender === '') {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: "Dear parent, this is your child's marks for " + doc.term + '\n' + '\n' + doc.fullname + '\n' + 'Admission Number - ' + doc.admissionNo + '\n' + 'Class - ' + doc.class + '\n' + 'Mathematics - ' + doc.Mathematics + '%\n' + 'English - ' + doc.English + '%\n' + 'Kiswahili - ' + doc.Kiswahili + '%\n' + 'Science - ' + doc.Science + '%\n' + 'SSRE - ' + doc.ssre + '%\n' + 'Total - ' + doc.Total + '\n' + 'Position - ' + doc.position + '\n' + 'Thank you. Powered By Elite-SMS.',
                        // Set your shortCode or senderId

                    }

                    // That’s it, hit send and we’ll take care of the rest
                    sms.send(options)
                        .then((response) => {
                            console.log(response)


                            if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {

                                })
                                console.log(response)
                                if (hist == 0) {
                                    var data = new History();
                                    data.userID = req.user.id;
                                    data.phone = doc.phone;
                                    data.createdOn = new Date();
                                    data.sendOn = timeHistory;
                                    data.typeMessage = 'School Exam Results';
                                    data.message = '....';
                                    data.save(function (err) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        console.log('Saved to history')
                                        hist = 2
                                    })
                                }
                                setTimeout(function () {
                                    OldPrimary.findByIdAndRemove(doc.id, function (err, customers) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        console.log('Deleted')
                                    })
                                }, 300)

                                req.flash('info', response.SMSMessageData.Message)
                                res.redirect('/oldCurriculumData')
                            }
                            else {
                                console.log(response)


                                req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                res.redirect('/oldCurriculumData')
                            }

                        })
                        .catch((error) => {
                            req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                            res.redirect('/oldCurriculumData')


                        });
                }
                else {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: "Dear parent, this is your child's marks for " + doc.term + "\n" + "\n" + doc.fullname + "\n" + "Admission Number - " + doc.admissionNo + "\n" + "Class - " + doc.class + "\n" + "Mathematics - " + doc.Mathematics + "%\n" + "English - " + doc.English + "%\n" + "Kiswahili - " + doc.Kiswahili + "%\n" + "Science - " + doc.Science + "%\n" + "SSRE - " + doc.ssre + "%\n" + "Total - " + doc.Total + "\n" + "Position - " + doc.position + "\n" + "Thank you. Powered By Elite-SMS.",
                        // Set your shortCode or senderId
                        from: req.body.sender
                    }

                    // That’s it, hit send and we’ll take care of the rest
                    sms.send(options)
                        .then((response) => {
                            console.log(response)
                            if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                req.flash('danger', response.SMSMessageData.Message)
                                res.redirect('/oldCurriculumData')


                            }
                            else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                    if (err) {
                                        res.redirect('/error')
                                    }
                                })
                                if (hist == 0) {
                                    var data = new History();
                                    data.userID = req.user.id;
                                    data.phone = '';
                                    data.createdOn = new Date();
                                    data.sendOn = timeHistory;
                                    data.typeMessage = 'School Exam Results';
                                    data.message = '';
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        hist = 2
                                    })
                                }
                                setTimeout(function () {
                                    OldPrimary.findByIdAndRemove(doc.id, function (err, customers) {
                                        if (err) {
                                            res.redirect('/error')
                                        }
                                        console.log('Deleted')
                                    })
                                }, 300)
                            }
                            else {


                                req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                res.redirect('/oldCurriculumData')

                            }


                        })
                        .catch((error) => {
                            console.log(error);
                            req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                            res.redirect('/oldCurriculumData')

                        });
                }

            }

            sendMessage();


        })
    }
})
router.post('/sendBulkSMS', auth, function (req, res) {
    let hist = 0
    if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
        req.flash('danger', 'Kindly add your africanstalking credentials')
        res.redirect('/sendBulk')
    }
    else if (req.body.template !== '' && req.body.message !== '') {
        req.flash('danger', 'Error, kindly choose one message option')
        res.redirect('/sendBulk')
    }
    else if (req.body.template === '' && req.body.message === '') {
        req.flash('danger', 'Error, kindly choose one message option')
        res.redirect('/sendBulk')
    }
    else {

        const credentials = {
            apiKey: req.user.apikeySMS,
            username: req.user.usernameSMS,
        }
        const AfricasTalking = require('africastalking')(credentials);

        // Get the SMS service
        const sms = AfricasTalking.SMS;
        if (req.body.typeSMS1 === 'option1') {
            if (req.body.template !== '') {
                Template.findOne({ name: req.body.template, userID: req.user.id }, function (err, template) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (req.body.sender === '') {
                        var customerCursor = Customer.find({ userID: req.user.id }).cursor();
                        customerCursor.on('data', function (doc) {

                            function sendMessage() {

                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc.phone,
                                    // Set your message
                                    message: template.message,
                                    // Set your shortCode or senderId

                                }

                                // That’s it, hit send and we’ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        console.log(response)

                                        if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                                if (err) {
                                                    res.redirect('/error')
                                                }
                                            })
                                            req.flash('info', response.SMSMessageData.Message)
                                            res.redirect('/sendBulk')
                                            if (hist == 0) {
                                                var data = new History();
                                                data.userID = req.user.id;
                                                data.phone = '....';
                                                data.senderID = '....'
                                                data.createdOn = new Date();
                                                data.sendOn = timeHistory;
                                                data.typeMessage = 'Bulk SMS';
                                                data.message = template.message;
                                                data.save(function (err) {
                                                    console.log('Saved to history')
                                                    hist = 2
                                                })
                                            }
                                        }
                                        else {
                                            req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                            res.redirect('/sendBulk')
                                        }
                                    })
                                    .catch((error) => {
                                        req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                                        res.redirect('/sendBulk')


                                    });



                            }

                            sendMessage();

                        })
                    }
                    else {

                        var customerCursor = Customer.find({ userID: req.user.id }).cursor();
                        customerCursor.on('data', function (doc) {

                            function sendMessage() {
                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc.phone,
                                    // Set your message
                                    message: template.message,
                                    // Set your shortCode or senderId
                                    from: req.body.sender
                                }

                                // That’s it, hit send and we’ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                            req.flash('danger', response.SMSMessageData.Message)
                                            res.redirect('/sendBulk')
                                            console.log(response)
                                        }
                                        else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5 } }, function (err) {
                                                if (err) {
                                                    res.redirect('/error')
                                                }
                                            })
                                            if (hist == 0) {
                                                var data = new History();
                                                data.userID = req.user.id;
                                                data.phone = '';
                                                data.senderID = req.body.sender
                                                data.createdOn = new Date();
                                                data.sendOn = timeHistory;
                                                data.typeMessage = 'Bulk SMS';
                                                data.message = template.message;
                                                data.save(function (err) {
                                                    if (err) {
                                                        res.redirect('/error')
                                                    }
                                                    console.log('Saved to history')
                                                    hist = 2
                                                })
                                            }
                                        }
                                        else {
                                            req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                            res.redirect('/sendBulk')
                                            console.log(response)
                                        }


                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                                        res.redirect('/sendBulk')

                                    });



                            }

                            sendMessage();

                        })
                    }
                })
            }
            else if (req.body.message !== '') {
                if (req.body.sender === '') {
                    var customerCursor = Customer.find({ userID: req.user.id }).cursor();
                    customerCursor.on('data', function (doc) {

                        function sendMessage() {

                            const options = {
                                // Set the numbers you want to send to in international format
                                to: '+' + doc.phone,
                                // Set your message
                                message: req.body.message,
                                // Set your shortCode or senderId

                            }

                            // That’s it, hit send and we’ll take care of the rest
                            sms.send(options)
                                .then((response) => {
                                    console.log(response)

                                    if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                        db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                            if (err) {
                                                res.redirect('/error')
                                            }
                                        })
                                        req.flash('info', response.SMSMessageData.Message)
                                        res.redirect('/sendBulk')
                                        if (hist == 0) {
                                            var data = new History();
                                            data.userID = req.user.id;
                                            data.phone = '....';
                                            data.senderID = '....'
                                            data.createdOn = new Date();
                                            data.sendOn = timeHistory;
                                            data.typeMessage = 'Bulk SMS';
                                            data.message = req.body.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                                hist = 2
                                            })
                                        }
                                    }
                                    else {
                                        req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                        res.redirect('/sendBulk')
                                    }
                                })
                                .catch((error) => {
                                    req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                                    res.redirect('/sendBulk')


                                });



                        }

                        sendMessage();

                    })
                }
                else {

                    var customerCursor = Customer.find({ userID: req.user.id }).cursor();
                    customerCursor.on('data', function (doc) {

                        function sendMessage() {
                            const options = {
                                // Set the numbers you want to send to in international format
                                to: '+' + doc.phone,
                                // Set your message
                                message: req.body.message,
                                // Set your shortCode or senderId
                                from: req.body.sender
                            }

                            // That’s it, hit send and we’ll take care of the rest
                            sms.send(options)
                                .then((response) => {
                                    if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                        req.flash('danger', response.SMSMessageData.Message)
                                        res.redirect('/sendBulk')
                                        console.log(response)
                                    }
                                    else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                        db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5 } }, function (err) {
                                            if (err) {
                                                res.redirect('/error')
                                            }
                                        })
                                        if (hist == 0) {
                                            var data = new History();
                                            data.userID = req.user.id;
                                            data.phone = '';
                                            data.senderID = req.body.sender
                                            data.createdOn = new Date();
                                            data.sendOn = timeHistory;
                                            data.typeMessage = 'Bulk SMS';
                                            data.message = req.body.message;
                                            data.save(function (err) {
                                                if (err) {
                                                    res.redirect('/error')
                                                }
                                                console.log('Saved to history')
                                                hist = 2
                                            })
                                        }
                                    }
                                    else {
                                        req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                        res.redirect('/sendBulk')
                                        console.log(response)
                                    }


                                })
                                .catch((error) => {
                                    console.log(error);
                                    req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                                    res.redirect('/sendBulk')

                                });



                        }

                        sendMessage();

                    })
                }
            }

        }
        else if (req.body.typeSMS1 === 'option2') {
            if (req.body.template !== '') {
                Template.findOne({ name: req.body.template, userID: req.user.id }, function (err, template) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (req.body.sender === '') {
                        var customerCursor = Customer.find({ userID: req.user.id,group:req.body.group}).cursor();
                        customerCursor.on('data', function (doc) {

                            function sendMessage() {

                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc.phone,
                                    // Set your message
                                    message: template.message,
                                    // Set your shortCode or senderId

                                }

                                // That’s it, hit send and we’ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        console.log(response)

                                        if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                                if (err) {
                                                    res.redirect('/error')
                                                }
                                            })
                                            req.flash('info', response.SMSMessageData.Message)
                                            res.redirect('/sendBulk')
                                            if (hist == 0) {
                                                var data = new History();
                                                data.userID = req.user.id;
                                                data.phone = '....';
                                                data.senderID = '....'
                                                data.createdOn = new Date();
                                                data.sendOn = timeHistory;
                                                data.typeMessage = 'Bulk SMS';
                                                data.message = template.message;
                                                data.save(function (err) {
                                                    console.log('Saved to history')
                                                    hist = 2
                                                })
                                            }
                                        }
                                        else {
                                            req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                            res.redirect('/sendBulk')
                                        }
                                    })
                                    .catch((error) => {
                                        req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                                        res.redirect('/sendBulk')


                                    });



                            }

                            sendMessage();

                        })
                    }
                    else {

                        var customerCursor = Customer.find({ userID: req.user.id,group:req.body.group }).cursor();
                        customerCursor.on('data', function (doc) {

                            function sendMessage() {
                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc.phone,
                                    // Set your message
                                    message: template.message,
                                    // Set your shortCode or senderId
                                    from: req.body.sender
                                }

                                // That’s it, hit send and we’ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                            req.flash('danger', response.SMSMessageData.Message)
                                            res.redirect('/sendBulk')
                                            console.log(response)
                                        }
                                        else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5 } }, function (err) {
                                                if (err) {
                                                    res.redirect('/error')
                                                }
                                            })
                                            if (hist == 0) {
                                                var data = new History();
                                                data.userID = req.user.id;
                                                data.phone = '';
                                                data.senderID = req.body.sender
                                                data.createdOn = new Date();
                                                data.sendOn = timeHistory;
                                                data.typeMessage = 'Bulk SMS';
                                                data.message = template.message;
                                                data.save(function (err) {
                                                    if (err) {
                                                        res.redirect('/error')
                                                    }
                                                    console.log('Saved to history')
                                                    hist = 2
                                                })
                                            }
                                        }
                                        else {
                                            req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                            res.redirect('/sendBulk')
                                            console.log(response)
                                        }


                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                                        res.redirect('/sendBulk')

                                    });



                            }

                            sendMessage();

                        })
                    }
                })
            }
            else if (req.body.message !== '') {
                if (req.body.sender === '') {
                    var customerCursor = Customer.find({ userID: req.user.id,group:req.body.group }).cursor();
                    customerCursor.on('data', function (doc) {

                        function sendMessage() {

                            const options = {
                                // Set the numbers you want to send to in international format
                                to: '+' + doc.phone,
                                // Set your message
                                message: req.body.message,
                                // Set your shortCode or senderId

                            }

                            // That’s it, hit send and we’ll take care of the rest
                            sms.send(options)
                                .then((response) => {
                                    console.log(response)

                                    if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                        db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5, messages: 1 } }, function (err) {
                                            if (err) {
                                                res.redirect('/error')
                                            }
                                        })
                                        req.flash('info', response.SMSMessageData.Message)
                                        res.redirect('/sendBulk')
                                        if (hist == 0) {
                                            var data = new History();
                                            data.userID = req.user.id;
                                            data.phone = '....';
                                            data.senderID = '....'
                                            data.createdOn = new Date();
                                            data.sendOn = timeHistory;
                                            data.typeMessage = 'Bulk SMS';
                                            data.message = req.body.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                                hist = 2
                                            })
                                        }
                                    }
                                    else {
                                        req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                        res.redirect('/sendBulk')
                                    }
                                })
                                .catch((error) => {
                                    req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                                    res.redirect('/sendBulk')


                                });



                        }

                        sendMessage();

                    })
                }
                else {

                    var customerCursor = Customer.find({ userID: req.user.id,group:req.body.group }).cursor();
                    customerCursor.on('data', function (doc) {

                        function sendMessage() {
                            const options = {
                                // Set the numbers you want to send to in international format
                                to: '+' + doc.phone,
                                // Set your message
                                message: req.body.message,
                                // Set your shortCode or senderId
                                from: req.body.sender
                            }

                            // That’s it, hit send and we’ll take care of the rest
                            sms.send(options)
                                .then((response) => {
                                    if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                        req.flash('danger', response.SMSMessageData.Message)
                                        res.redirect('/sendBulk')
                                        console.log(response)
                                    }
                                    else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                        db.users.update({ _id: mongojs.ObjectId(req.user.id) }, { $inc: { amount: 5 } }, function (err) {
                                            if (err) {
                                                res.redirect('/error')
                                            }
                                        })
                                        if (hist == 0) {
                                            var data = new History();
                                            data.userID = req.user.id;
                                            data.phone = '';
                                            data.senderID = req.body.sender
                                            data.createdOn = new Date();
                                            data.sendOn = timeHistory;
                                            data.typeMessage = 'Bulk SMS';
                                            data.message = req.body.message;
                                            data.save(function (err) {
                                                if (err) {
                                                    res.redirect('/error')
                                                }
                                                console.log('Saved to history')
                                                hist = 2
                                            })
                                        }
                                    }
                                    else {
                                        req.flash('danger', 'Message not sent. You have Insufficient SMS balance. Kindly top up')
                                        res.redirect('/sendBulk')
                                        console.log(response)
                                    }


                                })
                                .catch((error) => {
                                    console.log(error);
                                    req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                                    res.redirect('/sendBulk')

                                });



                        }

                        sendMessage();

                    })
                }
            }
        }



    }
})
//sendOneMessage
router.post('/basicReminder', auth, function (req, res) {
    if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
        req.flash('danger', 'Kindly add your africanstalking credentials')
        res.redirect('/recurrence')
    }
    else if(req.body.template!=='' && req.body.message!=='')
    {
        req.flash('danger', 'Kindly choose one message option, either a message template or draft a new message.')
        res.redirect('/recurrence')
    }
    else if(req.body.group!=='' && req.body.phone!=='')
    {
        req.flash('danger', 'Kindly choose one option, either an individual or group.')
        res.redirect('/recurrence')
    }
    else if(req.body.template ==='' && req.body.message ==='')
    {
        req.flash('danger', 'Kindly choose one message option, either a message template or draft a new message.')
        res.redirect('/recurrence')
    }
    else {
        
        if(req.body.template !=='')
        {
            Template.findOne({userID:req.user.id,name:req.body.template},function(err,template){

         if(req.body.phone !=='')
         {
            Basic.findOne({ phone: req.body.phone,userID:req.user.id,typeMessage: 'Individual', message: template.message }, function (err, basic) {
                Customer.findOne({phone:req.body.phone,userID:req.user.id},function(err,customer){
                if (err) {
                    res.redirect('/error')
                }
                if (basic) {
                    req.flash('danger', 'This reminder already exists.')
                    res.redirect('/recurrence')
                }
                else {
                    if(customer)
                            {
                    var data = new Basic();
                    data.phone = req.body.phone;
                    data.typeMessage = 'Individual';
                    data.group=customer.group
                    data.createdOn = new Date();
                    data.scheduleddate = req.body.date + '/' + req.body.time;
                    data.message = template.message;
                    data.userID = req.user.id;
                    data.usernameSMS = req.user.usernameSMS;
                    data.senderidSMS = req.body.sender;
                    data.apikeySMS = req.user.apikeySMS;
                    data.account = true
                    data.status = 'Pending'
                    data.save(function (err) {
                        if (err) {
                            res.redirect('/error')
                        }
                        req.flash('info', 'Basic reminder was added successfully and it will be sent on ' + req.body.date + '/' + req.body.time + ' to ' + req.body.phone)
                        res.redirect('/recurrence')
                    })
                }
                else
                {
                    var data = new Basic();
                    data.phone = req.body.phone;
                    data.typeMessage = 'Individual';
                    data.group='....'
                    data.createdOn = new Date();
                    data.scheduleddate = req.body.date + '/' + req.body.time;
                    data.message = template.message;
                    data.userID = req.user.id;
                    data.usernameSMS = req.user.usernameSMS;
                    data.senderidSMS = req.body.sender;
                    data.apikeySMS = req.user.apikeySMS;
                    data.account = true
                    data.status = 'Pending'
                    data.save(function (err) {
                        if (err) {
                            res.redirect('/error')
                        }
                        req.flash('info', 'Basic reminder was added successfully and it will be sent on ' + req.body.date + '/' + req.body.time + ' to ' + req.body.phone)
                        res.redirect('/recurrence')
                    })
                }
            }
            })})
         }
         else if(req.body.group !=='')
         {
            Basic.findOne({ group:req.body.group,userID:req.user.id, message: template.message }, function (err, basic) {
                if (err) {
                    res.redirect('/error')
                }
                if (basic) {
                    req.flash('danger', 'This reminder already exists.')
                    res.redirect('/recurrence')
                }
                else {
                    var data = new Basic();
                    data.phone = '....';
                    data.typeMessage = 'Group';
                    data.createdOn = new Date();
                    data.scheduleddate = req.body.date + '/' + req.body.time;
                    data.message = template.message;
                    data.userID = req.user.id;
                    data.usernameSMS = req.user.usernameSMS;
                    data.senderidSMS = req.body.sender;
                    data.apikeySMS = req.user.apikeySMS;
                    data.account = true
                    data.status = 'Pending'
                    data.save(function (err) {
                        if (err) {
                            res.redirect('/error')
                        }
                        req.flash('info', 'Basic reminder added successfully and it will be sent on ' + req.body.date + '/' + req.body.time + ' to all group members of ' + req.body.group)
                        res.redirect('/recurrence')
                    })
                }
            })
         }
         else  if(req.body.typeSMS==='option3')
         {
                if (err) {
                    res.redirect('/error')
                }
               
                else {
                    var data = new Basic();
                    data.phone = '....';
                    data.group ='....'
                    data.typeMessage = 'Bulk';
                    data.createdOn = new Date();
                    data.scheduleddate = req.body.date + '/' + req.body.time;
                    data.message = template.message;
                    data.userID = req.user.id;
                    data.senderidSMS = req.body.sender;
                    data.usernameSMS = req.user.usernameSMS;
                    data.apikeySMS = req.user.apikeySMS;
                    data.account = true
                    data.status = 'Pending'
                    data.save(function (err) {
                        if (err) {
                            res.redirect('/error')
                        }
        
                        req.flash('info', 'Basic reminder was added successfully and it will be sent on ' + req.body.date + '/' + req.body.time + ' to all your customers.')
                        res.redirect('/recurrence')
                    })
                }
           
         }
        })
        }
        else if(req.body.message !=='')
        {
           
                if(req.body.phone !=='')
                {
                   Basic.findOne({ phone: req.body.phone,userID:req.user.id,typeMessage: 'Individual', message: req.body.message  }, function (err, basic) {
                       Customer.findOne({phone:req.body.phone,userID:req.user.id},function(err,customer){
                       if (err) {
                           res.redirect('/error')
                       }
                       if (basic) {
                           req.flash('danger', 'This reminder already exists.')
                           res.redirect('/recurrence')
                       }
                       else {
                        if(customer)
                        {
                           var data = new Basic();
                           data.phone = req.body.phone;
                           data.typeMessage = 'Individual';
                           data.group=customer.group
                           data.createdOn = new Date();
                           data.scheduleddate = req.body.date + '/' + req.body.time;
                           data.message = req.body.message;
                           data.userID = req.user.id;
                           data.usernameSMS = req.user.usernameSMS;
                           data.senderidSMS = req.body.sender;
                           data.apikeySMS = req.user.apikeySMS;
                           data.account = true
                           data.status = 'Pending'
                           data.save(function (err) {
                               if (err) {
                                   res.redirect('/error')
                               }
                               req.flash('info', 'Basic reminder was added successfully and it will be sent on ' + req.body.date + '/' + req.body.time + ' to ' + req.body.phone)
                               res.redirect('/recurrence')
                           })
                       }
                       else
                       {
                        var data = new Basic();
                        data.phone = req.body.phone;
                        data.typeMessage = 'Individual';
                        data.group='....'
                        data.createdOn = new Date();
                        data.scheduleddate = req.body.date + '/' + req.body.time;
                        data.message = req.body.message;
                        data.userID = req.user.id;
                        data.usernameSMS = req.user.usernameSMS;
                        data.senderidSMS = req.body.sender;
                        data.apikeySMS = req.user.apikeySMS;
                        data.account = true
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            req.flash('info', 'Basic reminder was added successfully and it will be sent on ' + req.body.date + '/' + req.body.time + ' to ' + req.body.phone)
                            res.redirect('/recurrence')
                        })
                       }
                    }
                   })})
                }
                else if(req.body.group !=='')
                {
                   Basic.findOne({ group:req.body.group,userID:req.user.id, message: req.body.message }, function (err, basic) {
                       if (err) {
                           res.redirect('/error')
                       }
                       if (basic) {
                           req.flash('danger', 'This reminder already exists.')
                           res.redirect('/recurrence')
                       }
                       else {
                           var data = new Basic();
                           data.phone = '...';
                           data.typeMessage = 'Group';
                           data.createdOn = new Date();
                           data.scheduleddate = req.body.date + '/' + req.body.time;
                           data.message = req.body.message;
                           data.userID = req.user.id;
                           data.usernameSMS = req.user.usernameSMS;
                           data.senderidSMS = req.body.sender;
                           data.apikeySMS = req.user.apikeySMS;
                           data.account = true
                           data.status = 'Pending'
                           data.save(function (err) {
                               if (err) {
                                   res.redirect('/error')
                               }
                               req.flash('info', 'Basic reminder was added successfully and it will be sent on ' + req.body.date + '/' + req.body.time + ' to all group members of ' + req.body.group)
                               res.redirect('/recurrence')
                           })
                       }
                   })
                }
                else  if(req.body.typeSMS==='option3')
                {
                       if (err) {
                           res.redirect('/error')
                       }
                      
                       else {
                           var data = new Basic();
                           data.phone='....'
                           data.group ='....'
                           data.typeMessage = 'Bulk';
                           data.createdOn = new Date();
                           data.scheduleddate = req.body.date + '/' + req.body.time;
                           data.message = req.body.message;
                           data.userID = req.user.id;
                           data.senderidSMS = req.body.sender;
                           data.usernameSMS = req.user.usernameSMS;
                           data.apikeySMS = req.user.apikeySMS;
                           data.account = true
                           data.status = 'Pending'
                           data.save(function (err) {
                               if (err) {
                                   res.redirect('/error')
                               }
               
                               req.flash('info', 'Basic reminder was added successfully and it will be sent on ' + req.body.date + '/' + req.body.time + ' to all your customers.')
                               res.redirect('/recurrence')
                           })
                       }
                  
                }
             

        }
        
    }

})
//Daily Reminder
router.post('/dailyReminder', auth, function (req, res) {
    if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
        req.flash('danger', 'Kindly add your africanstalking credentials')
        res.redirect('/recurrence')
    }
    else if(req.body.template!=='' && req.body.message!=='')
    {
        req.flash('danger', 'Kindly choose one message option, either a message template or draft a new message.')
        res.redirect('/recurrence')
    }
    else if(req.body.group!=='' && req.body.phone!=='')
    {
        req.flash('danger', 'Kindly choose one option, either an individual or group.')
        res.redirect('/recurrence')
    }
    else if(req.body.template ==='' && req.body.message ==='')
    {
        req.flash('danger', 'Kindly choose one message option, either a message template or draft a new message.')
        res.redirect('/recurrence')
    }
    else
    {
         
        if(req.body.template !=='')
        {
            Template.findOne({userID:req.user.id,name:req.body.template},function(err,template){
                if(req.body.phone !=='')
                {
                    Daily.findOne({ typeMessage: 'Individual', phone: req.body.phone, message: template.message }, function (err, daily) {
                       Customer.findOne({phone:req.body.phone,userID:req.user.id},function(err,customer){

                       
                        if (err) {
                            res.redirect('/error')
                        }
                        if (daily) {
                            req.flash('danger', 'Daily reminder already exists.')
                            res.redirect('/recurrence')
                        }
                        else {
                            if(customer)
                            {
                            var data = new Daily();
                            data.phone = req.body.phone;
                            data.typeMessage = 'Individual';
                            data.createdOn = new Date();
                            data.every = req.body.every
                            data.account = true
                            data.scheduleddate = req.body.start + '/' + req.body.time;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = template.message;
                            data.time = req.body.time
                            data.group = customer.group
                            data.userID = req.user.id;
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to ' + req.body.phone)
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every' + req.body.every + ' day(s) to ' + req.body.phone + ' and it will end on ' + req.body.date + "/" + req.body.time)
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                        else
                        {
                            var data = new Daily();
                            data.phone = req.body.phone;
                            data.typeMessage = 'Individual';
                            data.createdOn = new Date();
                            data.every = req.body.every
                            data.account = true
                            data.scheduleddate = req.body.start + '/' + req.body.time;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = template.message;
                            data.time = req.body.time
                            data.group = '....'
                            data.userID = req.user.id;
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to ' + req.body.phone)
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every' + req.body.every + ' day(s) to ' + req.body.phone + ' and it will end on ' + req.body.date + "/" + req.body.time)
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                    }
                    })
                })
                }
                else if(req.body.group !=='')
                {
                    Daily.findOne({ typeMessage: 'Group', phone: req.body.phone, message: template.message }, function (err, daily) {
                     
                        
                         if (err) {
                             res.redirect('/error')
                         }
                         if (daily) {
                             req.flash('danger', 'Daily reminder already exists.')
                             res.redirect('/recurrence')
                         }
                         else {
                             var data = new Daily();
                             data.phone = '....';
                             data.group = req.body.group;
                             data.typeMessage = 'Group';
                             data.createdOn = new Date();
                             data.every = req.body.every
                             data.account = true
                             data.scheduleddate = req.body.start + '/' + req.body.time;
                             if (req.body.date === '') {
                                 data.finaldate = '';
                             }
                             if (req.body.date !== '') {
                                 data.finaldate = req.body.date + '/' + req.body.time;
                             }
                             data.message = template.message;
                             data.time = req.body.time
                             data.userID = req.user.id;
                             data.senderidSMS = req.body.sender;
                             data.usernameSMS = req.user.usernameSMS;
                             data.apikeySMS = req.user.apikeySMS;
                             data.status = 'Pending'
                             data.save(function (err) {
                                 if (err) {
                                     res.redirect('/error')
                                 }
                                 if (req.body.date === '') {
                                     req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to all members in '+req.body.group+' group.' )
                                     res.redirect('/recurrence')
                                 }
                                 if (req.body.date !== '') {
                                     req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every' + req.body.every + ' day(s) to all members in '+req.body.group+' group. It will end on ' + req.body.date + "/" + req.body.time)
                                     res.redirect('/recurrence')
                                 }
         
                             })
                         }
                     })
               
                }
                else if(req.body.typeSMS==='option3')
                {
                    Daily.findOne({ typeMessage: 'Bulk', phone: '....',userID:req.user.id, message: template.message }, function (err, daily) {
                     
                        
                        if (err) {
                            res.redirect('/error')
                        }
                        if (daily) {
                            req.flash('danger', 'Daily reminder already exists.')
                            res.redirect('/recurrence')
                        }
                        else {
                            var data = new Daily();
                            data.phone = '....';
                            data.group = '....';
                            data.typeMessage = 'Bulk';
                            data.createdOn = new Date();
                            data.every = req.body.every
                            data.account = true
                            data.scheduleddate = req.body.start + '/' + req.body.time;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = template.message;
                            data.time = req.body.time
                            data.userID = req.user.id;
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Daily reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to all your subscribers')
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Daily reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to all your subscribers and it will end on ' + req.body.date + "/" + req.body.time)
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                    })
                }
         })
         
        }
        else if(req.body.message !=='')
        {
          
                if(req.body.phone !=='')
                {
                    Daily.findOne({ typeMessage: 'Individual', phone: req.body.phone, message: req.body.message }, function (err, daily) {
                       Customer.findOne({phone:req.body.phone,userID:req.user.id},function(err,customer){

                       
                        if (err) {
                            res.redirect('/error')
                        }
                        if (daily) {
                            req.flash('danger', 'Daily reminder already exists.')
                            res.redirect('/recurrence')
                        }
                        else {
                            if(customer)
                            {
                            var data = new Daily();
                            data.phone = req.body.phone;
                            data.typeMessage = 'Individual';
                            data.createdOn = new Date();
                            data.every = req.body.every
                            data.account = true
                            data.scheduleddate = req.body.start + '/' + req.body.time;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = req.body.message;
                            data.time = req.body.time
                            data.group = customer.group
                            data.userID = req.user.id;
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to ' + req.body.phone)
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every' + req.body.every + ' day(s) to ' + req.body.phone + ' and it will end on ' + req.body.date + "/" + req.body.time)
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                        else
                        {
                            var data = new Daily();
                            data.phone = req.body.phone;
                            data.typeMessage = 'Individual';
                            data.createdOn = new Date();
                            data.every = req.body.every
                            data.account = true
                            data.scheduleddate = req.body.start + '/' + req.body.time;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = req.body.message;
                            data.time = req.body.time
                            data.group = '....'
                            data.userID = req.user.id;
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to ' + req.body.phone)
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every' + req.body.every + ' day(s) to ' + req.body.phone + ' and it will end on ' + req.body.date + "/" + req.body.time)
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                    }
                    })
                })
                }
                else if(req.body.group !=='')
                {
                    Daily.findOne({ typeMessage: 'Group', phone: req.body.phone, message: req.body.message }, function (err, daily) {
                     
                        
                         if (err) {
                             res.redirect('/error')
                         }
                         if (daily) {
                             req.flash('danger', 'Daily reminder already exists.')
                             res.redirect('/recurrence')
                         }
                         else {
                             var data = new Daily();
                             data.phone = '....';
                             data.group = req.body.group;
                             data.typeMessage = 'Group';
                             data.createdOn = new Date();
                             data.every = req.body.every
                             data.account = true
                             data.scheduleddate = req.body.start + '/' + req.body.time;
                             if (req.body.date === '') {
                                 data.finaldate = '';
                             }
                             if (req.body.date !== '') {
                                 data.finaldate = req.body.date + '/' + req.body.time;
                             }
                             data.message = req.body.message;
                             data.time = req.body.time
                             data.userID = req.user.id;
                             data.senderidSMS = req.body.sender;
                             data.usernameSMS = req.user.usernameSMS;
                             data.apikeySMS = req.user.apikeySMS;
                             data.status = 'Pending'
                             data.save(function (err) {
                                 if (err) {
                                     res.redirect('/error')
                                 }
                                 if (req.body.date === '') {
                                     req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to all members in '+req.body.group+' group.' )
                                     res.redirect('/recurrence')
                                 }
                                 if (req.body.date !== '') {
                                     req.flash('info', 'Daily reminder was added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every' + req.body.every + ' day(s) to all members in '+req.body.group+' group. It will end on ' + req.body.date + "/" + req.body.time)
                                     res.redirect('/recurrence')
                                 }
         
                             })
                         }
                     })
               
                }
                else if(req.body.typeSMS==='option3')
                {
                    Daily.findOne({ typeMessage: 'Bulk', phone: '....',userID:req.user.id, message: req.body.message }, function (err, daily) {
                     
                        
                        if (err) {
                            res.redirect('/error')
                        }
                        if (daily) {
                            req.flash('danger', 'Daily reminder already exists.')
                            res.redirect('/recurrence')
                        }
                        else {
                            var data = new Daily();
                            data.phone = '....';
                            data.group = '....';
                            data.typeMessage = 'Bulk';
                            data.createdOn = new Date();
                            data.every = req.body.every
                            data.account = true
                            data.scheduleddate = req.body.start + '/' + req.body.time;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = req.body.message;
                            data.time = req.body.time
                            data.userID = req.user.id;
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Daily reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to all your subscribers')
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Daily reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' day(s) at ' + req.body.time + ' to all your subscribers and it will end on ' + req.body.date + "/" + req.body.time)
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                    })
                }
     
        }
    }

})
//Weekly Reminder

router.post('/weeklyReminder', auth, function (req, res) {
    if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
        req.flash('danger', 'Kindly add your africanstalking credentials')
        res.redirect('/recurrence')
    }
    else if(req.body.template!=='' && req.body.message!=='')
    {
        req.flash('danger', 'Kindly choose one message option, either a message template or draft a new message.')
        res.redirect('/recurrence')
    }
    else if(req.body.group!=='' && req.body.phone!=='')
    {
        req.flash('danger', 'Kindly choose one option, either an individual or group.')
        res.redirect('/recurrence')
    }
    else if(req.body.template ==='' && req.body.message ==='')
    {
        req.flash('danger', 'Kindly choose one message option, either a message template or draft a new message.')
        res.redirect('/recurrence')
    }
    else
    {
        if(req.body.template !=='')
        {
         Template.findOne({userID:req.user.id,name:req.body.template},function(err,template){
            if(req.body.phone !=='')
            {
                Weekly.findOne({ typeMessage: 'Individual', phone: req.body.phone,userID:req.user.id, message: template.message }, function (err, weekly) {
                   Customer.findOne({userID:req.user.id,phone:req.body.phone},function(err,customer){

                   
                    if (err) {
                        res.redirect('/error')
                    }
                    if (weekly) {
                        req.flash('danger', 'Weekly reminder already exists.')
                        res.redirect('/recurrence')
                    }
                    else {
                        if(customer)
                            {
                        var data = new Weekly();
                        data.phone = req.body.phone;
                        data.group = customer.group
                        data.typeMessage = 'Individual';
                        data.createdOn = new Date();
                        data.weeks = req.body.week;
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = template.message;
                        data.time = req.body.time
                        data.userID = req.user.id;
                        data.account = true
                        data.senderidSMS = req.body.sender;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Weekly reminder added successfully.')
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Weekly reminder added successfully.')
                                res.redirect('/recurrence')
                            }
    
                        })
                    }
                    else
                    {
                        var data = new Weekly();
                        data.phone = req.body.phone;
                        data.group = '....'
                        data.typeMessage = 'Individual';
                        data.createdOn = new Date();
                        data.weeks = req.body.week;
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = template.message;
                        data.time = req.body.time
                        data.userID = req.user.id;
                        data.account = true
                        data.senderidSMS = req.body.sender;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Weekly reminder added successfully.')
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Weekly reminder added successfully.')
                                res.redirect('/recurrence')
                            }
    
                        })
                    }
                }
                })
            })
            }
            else if(req.body.group !=='')
            {
                Weekly.findOne({ typeMessage: 'Group', phone:'....',userID:req.user.id, message: template.message }, function (err, weekly) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (weekly) {
                        req.flash('danger', 'Weekly reminder already exists.')
                        res.redirect('/recurrence')
                    }
                    else {
                        var data = new Weekly();
                        data.phone = '....';
                        data.group = req.body.group
                        data.typeMessage = 'Group';
                        data.createdOn = new Date();
                        data.weeks = req.body.week;
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = template.message;
                        data.time = req.body.time
                        data.userID = req.user.id;
                        data.account = true
                        data.senderidSMS = req.body.sender;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Weekly reminder added successfully.')
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Weekly reminder added successfully.')
                                res.redirect('/recurrence')
                            }
    
                        })
                    }
                })
            }
            else if(req.body.typeSMS !=='option3')
            {
                Weekly.findOne({ typeMessage: 'Bulk', phone:'....',userID:req.user.id, message: template.message }, function (err, weekly) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (weekly) {
                        req.flash('danger', 'Weekly reminder already exists.')
                        res.redirect('/recurrence')
                    }
                    else {
                        var data = new Weekly();
                        data.phone = '....';
                        data.group = '....'
                        data.typeMessage = 'Bulk';
                        data.createdOn = new Date();
                        data.weeks = req.body.week;
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = template.message;
                        data.time = req.body.time
                        data.userID = req.user.id;
                        data.account = true
                        data.senderidSMS = req.body.sender;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Weekly reminder added successfully.')
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Weekly reminder added successfully.')
                                res.redirect('/recurrence')
                            }
    
                        })
                    }
                }) 
            }
         })
        }
        else if(req.body.message !=='')
        {
          
                if(req.body.phone !=='')
                {
                    Weekly.findOne({ typeMessage: 'Individual', phone: req.body.phone,userID:req.user.id, message: req.body.message }, function (err, weekly) {
                       Customer.findOne({userID:req.user.id,phone:req.body.phone},function(err,customer){
    
                       
                        if (err) {
                            res.redirect('/error')
                        }
                        if (weekly) {
                            req.flash('danger', 'Weekly reminder already exists.')
                            res.redirect('/recurrence')
                        }
                        else {
                            if(customer)
                            {
                            var data = new Weekly();
                            data.phone = req.body.phone;
                            data.group = customer.group
                            data.typeMessage = 'Individual';
                            data.createdOn = new Date();
                            data.weeks = req.body.week;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = req.body.message;
                            data.time = req.body.time
                            data.userID = req.user.id;
                            data.account = true
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Weekly reminder added successfully.')
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Weekly reminder added successfully.')
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                        else
                        {
                            var data = new Weekly();
                            data.phone = req.body.phone;
                            data.group = '....'
                            data.typeMessage = 'Individual';
                            data.createdOn = new Date();
                            data.weeks = req.body.week;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = req.body.message;
                            data.time = req.body.time
                            data.userID = req.user.id;
                            data.account = true
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Weekly reminder added successfully.')
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Weekly reminder added successfully.')
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                       }
                    })
                })
                }
                else if(req.body.group !=='')
                {
                    Weekly.findOne({ typeMessage: 'Group', phone:'....',userID:req.user.id, message: req.body.message }, function (err, weekly) {
                        if (err) {
                            res.redirect('/error')
                        }
                        if (weekly) {
                            req.flash('danger', 'Weekly reminder already exists.')
                            res.redirect('/recurrence')
                        }
                        else {
                            var data = new Weekly();
                            data.phone = '....';
                            data.group = req.body.group
                            data.typeMessage = 'Group';
                            data.createdOn = new Date();
                            data.weeks = req.body.week;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = req.body.message;
                            data.time = req.body.time
                            data.userID = req.user.id;
                            data.account = true
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Weekly reminder added successfully.')
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Weekly reminder added successfully.')
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                    })
                }
                else if(req.body.typeSMS !=='option3')
                {
                    Weekly.findOne({ typeMessage: 'Bulk', phone:'....',userID:req.user.id, message: req.body.message }, function (err, weekly) {
                        if (err) {
                            res.redirect('/error')
                        }
                        if (weekly) {
                            req.flash('danger', 'Weekly reminder already exists.')
                            res.redirect('/recurrence')
                        }
                        else {
                            var data = new Weekly();
                            data.phone = '....';
                            data.group = '....'
                            data.typeMessage = 'Bulk';
                            data.createdOn = new Date();
                            data.weeks = req.body.week;
                            if (req.body.date === '') {
                                data.finaldate = '';
                            }
                            if (req.body.date !== '') {
                                data.finaldate = req.body.date + '/' + req.body.time;
                            }
                            data.message = req.body.message;
                            data.time = req.body.time
                            data.userID = req.user.id;
                            data.account = true
                            data.senderidSMS = req.body.sender;
                            data.usernameSMS = req.user.usernameSMS;
                            data.apikeySMS = req.user.apikeySMS;
                            data.status = 'Pending'
                            data.save(function (err) {
                                if (err) {
                                    res.redirect('/error')
                                }
                                if (req.body.date === '') {
                                    req.flash('info', 'Weekly reminder added successfully.')
                                    res.redirect('/recurrence')
                                }
                                if (req.body.date !== '') {
                                    req.flash('info', 'Weekly reminder added successfully.')
                                    res.redirect('/recurrence')
                                }
        
                            })
                        }
                    }) 
                }
            

        }
    }
    
})

//Monthly Reminder

router.post('/monthlyReminder', auth, function (req, res) {

    if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
        req.flash('danger', 'Kindly add your africanstalking credentials')
        res.redirect('/recurrence')
    }
    else if(req.body.template!=='' && req.body.message!=='')
    {
        req.flash('danger', 'Kindly choose one message option, either a message template or draft a new message.')
        res.redirect('/recurrence')
    }
    else if(req.body.group!=='' && req.body.phone!=='')
    {
        req.flash('danger', 'Kindly choose one option, either an individual or group.')
        res.redirect('/recurrence')
    }
    else if(req.body.template ==='' && req.body.message ==='')
    {
        req.flash('danger', 'Kindly choose one message option, either a message template or draft a new message.')
        res.redirect('/recurrence')
    }
    else
    {
        if(req.body.template !=='')
        {
          Template.findOne({userID:req.user.id,name:req.body.template},function(err,template){
            if(req.body.phone !=='')
            {
              Customer.findOne({userID:req.user.id,phone:req.body.phone},function(err,customer){
                Monthly.findOne({ typeMessage: 'Individual', phone: req.body.phone, message: template.message }, function (err, monthly) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (monthly) {
                        req.flash('danger', 'Monthly reminder already exists.')
                        res.redirect('/recurrence')
                    }
                    else {
                        if(customer)
                        {
                        var data = new Monthly();
                        data.phone = req.body.phone;
                        data.typeMessage = 'Individual';
                        data.group =customer.group
                        data.createdOn = new Date();
                        data.every = req.body.every
                        data.scheduleddate = req.body.start + '/' + req.body.time;
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = template.message;
                        data.time = req.body.time
                        data.userID = req.user.id;
                        data.account = true
                        data.senderidSMS = req.body.user;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone)
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone + ' and it will end on ' + req.body.date)
                                res.redirect('/recurrence')
                            }
    
                        })
                    }
                
                else
                {
                    var data = new Monthly();
                    data.phone = req.body.phone;
                    data.typeMessage = 'Individual';
                    data.group ='....'
                    data.createdOn = new Date();
                    data.every = req.body.every
                    data.scheduleddate = req.body.start + '/' + req.body.time;
                    if (req.body.date === '') {
                        data.finaldate = '';
                    }
                    if (req.body.date !== '') {
                        data.finaldate = req.body.date + '/' + req.body.time;
                    }
                    data.message = template.message;
                    data.time = req.body.time
                    data.userID = req.user.id;
                    data.account = true
                    data.senderidSMS = req.body.sender;
                    data.usernameSMS = req.user.usernameSMS;
                    data.apikeySMS = req.user.apikeySMS;

                    data.status = 'Pending'
                    data.save(function (err) {
                        if (err) {
                            res.redirect('/error')
                        }
                        if (req.body.date === '') {
                            req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone)
                            res.redirect('/recurrence')
                        }
                        if (req.body.date !== '') {
                            req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone + ' and it will end on ' + req.body.date)
                            res.redirect('/recurrence')
                        }

                    })
                }
            }
                })

              })
            }
            else if(req.body.group !=='')
            {
                Monthly.findOne({ typeMessage: 'Group', phone: req.body.phone, message: template.message }, function (err, monthly) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (monthly) {
                        req.flash('danger', 'Monthly reminder already exists.')
                        res.redirect('/recurrence')
                    }
                    else {
                     
                        var data = new Monthly();
                        data.phone = '....';
                        data.typeMessage = 'Group';
                        data.group =req.body.group
                        data.createdOn = new Date();
                        data.every = req.body.every
                        data.scheduleddate = req.body.start + '/' + req.body.time;
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = template.message;
                        data.time = req.body.time
                        data.userID = req.user.id;
                        data.account = true
                        data.senderidSMS = req.body.sender;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all subscribers in '+req.body.group+' group.' )
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all subscribers in ' + req.body.group + ' group. It will end on ' + req.body.date)
                                res.redirect('/recurrence')
                            }
    
                        })
                  
             
            }
                })
            }
            else if(req.body.typeSMS==='option3')
            {
                Monthly.findOne({ typeMessage: 'Bulk',userID:req.user.id, message: template.message }, function (err, monthly) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (monthly) {
                        req.flash('danger', 'Monthly reminder already exists')
                        res.redirect('/recurrence')
                    }
                    else {
                        var data = new Monthly();
                        data.typeMessage = 'Bulk';
                        data.phone='....';
                        data.group='....'
                        data.createdOn = new Date();
                        data.every = req.body.every
                        data.scheduleddate = req.body.start + '/' + req.body.time;
        
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = template.message;
                        data.userID = req.user.id;
                        data.time = req.body.time;
                        data.account = true
                        data.senderidSMS = req.body.sender;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and  it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all your subscribers.')
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all your subscribers and it will end on ' + req.body.date)
                                res.redirect('/recurrence')
                            }
        
                        })
                    }
                }) 
            }
          })
        }
        else if(req.body.mesage !=='')
        {
            if(req.body.phone !=='')
            {
              Customer.findOne({userID:req.user.id,phone:req.body.phone},function(err,customer){
                Monthly.findOne({ typeMessage: 'Individual', phone: req.body.phone, message: req.body.message }, function (err, monthly) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (monthly) {
                        req.flash('danger', 'Monthly reminder already exists.')
                        res.redirect('/recurrence')
                    }
                    else {
                        if(customer)
                        {
                        var data = new Monthly();
                        data.phone = req.body.phone;
                        data.typeMessage = 'Individual';
                        data.group =customer.group
                        data.createdOn = new Date();
                        data.every = req.body.every
                        data.scheduleddate = req.body.start + '/' + req.body.time;
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = req.body.message;
                        data.time = req.body.time
                        data.userID = req.user.id;
                        data.account = true
                        data.senderidSMS = req.body.user;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone)
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone + ' and it will end on ' + req.body.date)
                                res.redirect('/recurrence')
                            }
    
                        })
                    }
                
                else
                {
                    var data = new Monthly();
                    data.phone = req.body.phone;
                    data.typeMessage = 'Individual';
                    data.group ='....'
                    data.createdOn = new Date();
                    data.every = req.body.every
                    data.scheduleddate = req.body.start + '/' + req.body.time;
                    if (req.body.date === '') {
                        data.finaldate = '';
                    }
                    if (req.body.date !== '') {
                        data.finaldate = req.body.date + '/' + req.body.time;
                    }
                    data.message = req.body.message;
                    data.time = req.body.time
                    data.userID = req.user.id;
                    data.account = true
                    data.senderidSMS = req.body.sender;
                    data.usernameSMS = req.user.usernameSMS;
                    data.apikeySMS = req.user.apikeySMS;

                    data.status = 'Pending'
                    data.save(function (err) {
                        if (err) {
                            res.redirect('/error')
                        }
                        if (req.body.date === '') {
                            req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone)
                            res.redirect('/recurrence')
                        }
                        if (req.body.date !== '') {
                            req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone + ' and it will end on ' + req.body.date)
                            res.redirect('/recurrence')
                        }

                    })
                }
            }
                })

              })
            }
            else if(req.body.group !=='')
            {
                Monthly.findOne({ typeMessage: 'Group', phone: req.body.phone, message: req.body.message }, function (err, monthly) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (monthly) {
                        req.flash('danger', 'Monthly reminder already exists.')
                        res.redirect('/recurrence')
                    }
                    else {
                     
                        var data = new Monthly();
                        data.phone = '....';
                        data.typeMessage = 'Group';
                        data.group =req.body.group
                        data.createdOn = new Date();
                        data.every = req.body.every
                        data.scheduleddate = req.body.start + '/' + req.body.time;
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = req.body.message;
                        data.time = req.body.time
                        data.userID = req.user.id;
                        data.account = true
                        data.senderidSMS = req.body.sender;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all subscribers in '+req.body.group+' group.' )
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all subscribers in ' + req.body.group + ' group. It will end on ' + req.body.date)
                                res.redirect('/recurrence')
                            }
    
                        })
                  
             
            }
                })
            }
            else if(req.body.typeSMS==='option3')
            {
                Monthly.findOne({ typeMessage: 'Bulk',userID:req.user.id, message: req.body.message}, function (err, monthly) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (monthly) {
                        req.flash('danger', 'Monthly reminder already exists')
                        res.redirect('/recurrence')
                    }
                    else {
                        var data = new Monthly();
                        data.typeMessage = 'Bulk';
                        data.phone='....';
                        data.group='....'
                        data.createdOn = new Date();
                        data.every = req.body.every
                        data.scheduleddate = req.body.start + '/' + req.body.time;
        
                        if (req.body.date === '') {
                            data.finaldate = '';
                        }
                        if (req.body.date !== '') {
                            data.finaldate = req.body.date + '/' + req.body.time;
                        }
                        data.message = req.body.message;
                        data.userID = req.user.id;
                        data.time = req.body.time;
                        data.account = true
                        data.senderidSMS = req.body.sender;
                        data.usernameSMS = req.user.usernameSMS;
                        data.apikeySMS = req.user.apikeySMS;
                        data.status = 'Pending'
                        data.save(function (err) {
                            if (err) {
                                res.redirect('/error')
                            }
                            if (req.body.date === '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and  it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all your subscribers.')
                                res.redirect('/recurrence')
                            }
                            if (req.body.date !== '') {
                                req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all your subscribers and it will end on ' + req.body.date)
                                res.redirect('/recurrence')
                            }
        
                        })
                    }
                }) 
            }
        }
    }
})
//test
router.post('/test', auth, function (req, res) {
    if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
        req.flash('danger', 'Kindly add your africanstalking credentials')
        res.redirect('/credentials')
    }
    else {
        const credentials = {
            apiKey: req.user.apikeySMS,
            username: req.user.usernameSMS,
        }
        const AfricasTalking = require('africastalking')(credentials);

        // Get the SMS service
        const sms = AfricasTalking.SMS;

        function sendMessage() {
            if (req.user.senderidSMS === '') {
                const options = {
                    // Set the numbers you want to send to in international format
                    to: '+' + req.body.phone,
                    // Set your message
                    message: "Success",
                    // Set your shortCode or senderId

                }

                // That’s it, hit send and we’ll take care of the rest
                sms.send(options)
                    .then((response) => {
                        req.flash('info', response.SMSMessageData.Message)
                        res.redirect('/credentials')
                    })
                    .catch((error) => {
                        req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                        res.redirect('/credentials')


                    });
            }
            else {
                const options = {
                    // Set the numbers you want to send to in international format
                    to: '+' + req.body.phone,
                    // Set your message
                    message: "Success",
                    // Set your shortCode or senderId
                    from: req.user.senderidSMS
                }

                // That’s it, hit send and we’ll take care of the rest
                sms.send(options)
                    .then((response) => {
                        if (response.SMSMessageData.Message === 'InvalidSenderId') {
                            req.flash('danger', response.SMSMessageData.Message)
                            res.redirect('/credentials')
                        }
                        else {
                            req.flash('info', response.SMSMessageData.Message)
                            res.redirect('/credentials')
                        }


                    })
                    .catch((error) => {
                        console.log(error);
                        req.flash('danger', error + ' . Kindly check if your africastalking credentials are correct!')
                        res.redirect('/credentials')

                    });
            }

        }

        sendMessage();
    }

})
//addCustomer
router.post('/addCustomer/:id', auth, function (req, res) {
    Group.findById(req.params.id, function (err, group) {

        if (err) {
            res.redirect('/error')
        }
        Customer.findOne({ group: group.name, firstname: req.body.firstname, lastname: req.body.lastname, phone: req.body.phone, userID: req.user.id }, function (err, customer) {
            if (err) {
                res.redirect('/error')
            }
            if (customer) {
                req.flash('danger', req.body.firstname + ' ' + req.body.lastname + ' already exists.');
                res.redirect('/addCustomer/' + group.id)
            }
            else {
                db.groups.update({ _id: mongojs.ObjectId(group.id) }, { $inc: { count: 1 } }, function (err) {
                    if (err) {
                        res.redirect('/error')
                    }
                })
                var data = new Customer();
                data.firstname = req.body.firstname;
                data.lastname = req.body.lastname;
                data.phone = req.body.phone;
                data.group = group.name
                data.userID = req.user.id
                data.save(function (err) {
                    if (err) {
                        res.redirect('/error')
                    }
                    req.flash('info', req.body.firstname + ' ' + req.body.lastname + ' added successfully.');
                    res.redirect('/addCustomer/' + group.id)
                })
            }
        })
    })
})
router.post('/addCustomer/:company/:group', auth, function (req, res) {
    Group.findOne({ name: req.params.group }, function (err, group) {

        if (err) {
            res.redirect('/error')
        }
        Customer.findOne({ group: group.name, firstname: req.body.firstname, lastname: req.body.lastname, phone: req.body.phone, userID: req.user.id }, function (err, customer) {
            if (err) {
                res.redirect('/error')
            }
            if (customer) {
                req.flash('danger', req.body.firstname + ' ' + req.body.lastname + ' already exists.');
                res.redirect('/share/' + req.params.company + '/' + req.params.group)
            }
            else {
                db.groups.update({ _id: mongojs.ObjectId(group.id) }, { $inc: { count: 1 } }, function (err) {
                    if (err) {
                        res.redirect('/error')
                    }
                })
                var data = new Customer();
                data.firstname = req.body.firstname;
                data.lastname = req.body.lastname;
                data.phone = req.body.phone;
                data.group = group.name
                data.userID = req.user.id
                data.save(function (err) {
                    if (err) {
                        res.redirect('/error')
                    }
                    req.flash('info', req.body.firstname + ' ' + req.body.lastname + ' added successfully.');
                    res.redirect('/share/' + req.params.company + '/' + req.params.group)
                })
            }
        })
    })
})


router.post('/editCustomer/:id/:id2', auth, function (req, res) {
    var query = {
        _id: req.params.id
    }
    var data = {};
    data.firstname = req.body.firstname;
    data.lastname = req.body.lastname;
    data.phone = req.body.phone;
    data.userID = req.user.id
    Customer.update(query, data, function (err) {
        if (err) {
            res.redirect('/error')
        }
        req.flash('info', req.body.firstname + ' ' + req.body.lastname + ' updated successfully.');
        res.redirect('/editCustomer/' + req.params.id + '/' + req.params.id2)
    })

})
//add-customer
router.post('/addCredentials', auth, function (req, res) {



    const credentials = {
        apiKey: req.body.apiKey,
        username: req.body.username
    }

    // Initialize the SDK
    const AfricasTalking = require('africastalking')(credentials);
    // Get the application service
    const app = AfricasTalking.APPLICATION;

    function getApplicationData() {
        // Fetch the application data
        app.fetchApplicationData()
            .then((data) => {
                var query = {
                    _id: req.user.id
                }
                var data = {};
                data.usernameSMS = req.body.username;

                data.apikeySMS = req.body.apiKey;
                User.update(query, data, function (err) {
                    if (err) {
                        res.redirect('/error')
                    }
                    req.flash('info', 'Credentials saved successfully.');
                    res.redirect('/credentials')
                })

            }).catch((error) => {
                req.flash('danger', error)
                res.redirect('/credentials')
            });
    }

    getApplicationData();



})
//admin-register
router.post('/admin-register', function (req, res) {
    if (req.body.password !== req.body.password2) {
        req.flash('danger', 'Passwords do not match')
        res.redirect('/signup')
    }
    else {
        User.findOne({ companyname: req.body.compnay, fullname: req.body.fullname, username: req.body.username, email: req.body.email }, function (err, user) {
            if (user) {
                req.flash('danger', 'This organization already exists')
                res.redirect('/signup')
            }
            else {
                var data = new User();
                data.companyname = req.body.company;
                data.fullname = req.body.fullname;
                data.username = req.body.username;
                data.email = req.body.email;
                data.messages = 0;

                data.amount = 0;
                data.atAmount = '';
                data.account = true


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
                                    res.redirect('/login')


                                }
                            })
                        }
                    })
                })
            }
        })

    }


});

router.get('/deleteCustomer/:id/:id2', auth, function (req, res) {
    db.groups.update({ _id: mongojs.ObjectId(req.params.id2) }, { $inc: { count: -1 } }, function (err) {

    })
    Customer.findByIdAndRemove(req.params.id, function (err, customers) {
        req.flash('danger', 'Customer deleted successfully')
        res.redirect('/groupCustomer/' + req.params.id2)
    })
})
router.get('/clearCustomers/:id', auth, function (req, res) {
    Group.findById(req.params.id, function (err, group) {
        db.groups.update({ _id: mongojs.ObjectId(req.params.id) }, { $set: { count: 0 } }, function (err) {
            Customer.remove({ userID: req.user.id, group: group.name }, function (err) {
                req.flash('danger', 'Customers deleted successfully')
                res.redirect('/groupCustomer/' + req.params.id)
            })
        })

    })
})
router.get('/deleteGroup/:id', auth, function (req, res) {
    Group.findById(req.params.id, function (err, group) {
        Customer.remove({ group: group.name, userID: req.user.id }, function (err) {
            Group.findByIdAndRemove(req.params.id, function (err) {
                req.flash('danger', 'Group deleted successfully.')
                res.redirect('/groups')
            })
        })
    })

})
router.get('/deleteBasic/:id',function(req,res){
    Basic.findByIdAndRemove(req.params.id,function(err){
        req.flash('danger','Reminder deleted successfully')
        res.redirect('/pendingReminders')
    })
})
router.get('/deleteDaily/:id',function(req,res){
    Daily.findByIdAndRemove(req.params.id,function(err){
        req.flash('danger','Reminder deleted successfully')
        res.redirect('/pendingReminders')
    })
})
router.get('/deleteWeek/:id',function(req,res){
    Month.findByIdAndRemove(req.params.id,function(err){
        req.flash('danger','Reminder deleted successfully')
        res.redirect('/pendingReminders')
    })
})
router.get('/deleteMonth/:id',function(req,res){
    Daily.findByIdAndRemove(req.params.id,function(err){
        req.flash('danger','Reminder deleted successfully')
        res.redirect('/pendingReminders')
    })
})
router.get('/clearoldPrimaryData', auth, function (req, res) {
    OldPrimary.remove({ userID: req.user.id }, function (err) {
        req.flash('danger', 'Data deleted successfully. Try again')
        res.redirect('/oldCurriculum')
    })
})
router.get('/clearoldPrimaryData2', auth, function (req, res) {
    OldPrimary.remove({ userID: req.user.id }, function (err) {

        res.redirect('/oldCurriculum')
    })
})


router.get('/clearschoolBalanceData', auth, function (req, res) {
    Balance.remove({ userID: req.user.id }, function (err) {
        req.flash('danger', 'Data deleted successfully. Try again')
        res.redirect('/school-balance')
    })
})
router.get('/clearschoolBalanceData2', auth, function (req, res) {
    Balance.remove({ userID: req.user.id }, function (err) {

        res.redirect('/school-balance')
    })
})


router.post('/admin-login',
    passport.authenticate('facilitator', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true,
        session: true

    })
);
router.get('/dashboard-logout',auth, function (req, res) {
    req.logout();
    req.flash('info', 'You are Logout, Please Log In.');
    res.redirect('/login')
});
module.exports = router;
