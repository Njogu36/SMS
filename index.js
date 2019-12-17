var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var fileUpload = require('express-fileupload');
var schedule = require('node-schedule');
const MongoStore = require('connect-mongo')(session);
var Basic = require('./models/basic.js');
var Daily = require('./models/daily.js')
var Monthly = require('./models/monthly.js')
var Weekly = require('./models/weekly.js')
var History = require('./models/history.js')
var Customer = require('./models/customer.js')
var User = require('./models/user.js')
var mongojs = require('mongojs');

require('./config/passport')(passport);




var app = express();
var config = require('./config/key.js')
var dab = mongojs(config.database, ['users'])
mongoose.connect(config.database);
var db = mongoose.connection;
db.on('error', function (err) {
    console.log(err)
});
db.once('open', function () {
    console.log('Database is connected')
})
app.set('view engine', 'jade');
app.set('/views', './views');
app.use(express.static('public'));
app.use(fileUpload())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
//express-validator
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
        var root = namespace.shift()
        var formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';

        }
        return {
            param: formParam,
            msg: msg,
            value: value
        }
    }
}));
//express-messages && connect-flash
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});
//express-session middleware


app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })

}));
app.use(passport.initialize());
app.use(passport.session());



var sms = require('./routes/index.js');
var admin = require('./routes/admin.js')
app.use('/ES-admin', admin)
app.use('/', sms);


// Start of Reminders
function addDays(n) {
    var t = new Date();
    t.setDate(t.getDate() + n);
    var month = "0" + (t.getMonth() + 1);
    var date = "0" + t.getDate();
    month = month.slice(-2);
    date = date.slice(-2);
    var date = t.getFullYear() + '-' + month + "-" + date;
    return date;
}
console.log(addDays(90))

var date = new Date();


var hour = ('0' + date.getHours()).slice(-2);
var min = ('0' + date.getMinutes()).slice(-2);
var sec = date.getSeconds();
var year = date.getFullYear();
var day = ('0' + date.getDate()).slice(-2);
var month = ('0' + (date.getMonth() + 1)).slice(-2);
//2019-11-14/04:56
var timeHistory = year + "-" + month + "-" + day + "/" + hour + ":" + min;
console.log(timeHistory)
//----------Basic Reminder------------------------------

function Basicc() {
    var date = new Date();


    var hour = ('0' + date.getHours()).slice(-2);
    var min = ('0' + date.getMinutes()).slice(-2);
    var sec = date.getSeconds();
    var year = date.getFullYear();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    //2019-11-14/04:56
    var time = year + "-" + month + "-" + day + "/" + hour + ":" + min;
    console.log(time)
    var basicCursor = Basic.find({ 'account': true, 'scheduleddate': time }).cursor();
    basicCursor.on('data', function (doc) {
        console.log('DONE')
        const credentials = {
            apiKey: doc.apikeySMS,
            username: doc.usernameSMS,
        }
        const AfricasTalking = require('africastalking')(credentials);

        // Get the SMS service
        const sms = AfricasTalking.SMS;


        if (doc.typeMessage === 'Individual') {
            function sendMessage() {
                if (doc.senderidSMS === '') {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: doc.message,
                        // Set your shortCode or senderId

                    }

                    // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                    sms.send(options)
                        .then((response) => {
                            console.log(response.SMSMessageData.Message)
                            if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                User.findById(doc.userID, function (err, user) {
                                    {

                                        var query = { _id: user.id };
                                        var data = {}
                                        var add = user.amount + 7;
                                        var message = user.messages + 1
                                        data.messages = message
                                        data.amount = add;
                                        User.update(query, data, function () { console.log('Added successfully') })
                                    }
                                })
                                var data = new History();
                                data.userID = doc.userID;
                                data.sender = doc.senderidSMS
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.status = 'Sent'
                                data.reason = response.SMSMessageData.Message
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                Basic.findByIdAndRemove(doc.id, function (err) {
                                    console.log('Deleted')
                                })
                            }
                            else {
                                Basic.findByIdAndRemove(doc.id, function (err) {
                                    console.log('Deleted')
                                })

                            }

                        })
                        .catch((error) => {
                            console.log(error)

                        });
                }
                else {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: doc.message,
                        // Set your shortCode or senderId
                        from: doc.senderidSMS
                    }

                    // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                    sms.send(options)
                        .then((response) => {
                            if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                var data = new History();
                                data.userID = doc.userID;
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.status = 'Not Sent';
                                data.sender = doc.senderidSMS
                                data.reason = response.SMSMessageData.Message
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                Basic.findByIdAndRemove(doc.id, function (err) {
                                    console.log('Deleted')
                                })
                            }
                            else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                User.findById(doc.userID, function (err, user) {
                                    {

                                        var query = { _id: user.id };
                                        var data = {}
                                        var add = user.amount + 7;
                                        var message = user.messages + 1
                                        data.messages = message
                                        data.amount = add;
                                        User.update(query, data, function () { console.log('Added successfully') })
                                    }
                                })
                                var data = new History();
                                data.userID = doc.userID;
                                data.sender = doc.senderidSMS
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.status = 'Sent'
                                data.reason = response.SMSMessageData.Message
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                Basic.findByIdAndRemove(doc.id, function (err) {
                                    console.log('Deleted')
                                })
                            }
                            else {
                                var data = new History();
                                data.userID = doc.userID;
                                data.phone = doc.phone;
                                data.sender = doc.senderidSMS
                                data.group = doc.group
                                data.status = 'Not Sent';
                                data.reason = response.SMSMessageData.Message
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                Basic.findByIdAndRemove(doc.id, function (err) {
                                    console.log('Deleted')
                                })
                            }


                        })
                        .catch((error) => {
                            console.log(error)

                        });
                }

            }

            sendMessage();
        }
        // BULK BASIC
        else if (doc.typeMessage === 'Group') {
            var customerCursor = Customer.find({ userID: doc.userID, group: doc.group }).cursor();
            customerCursor.on('data', function (doc2) {


                function sendMessage1() {
                    if (doc.senderidSMS === '') {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId

                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.sender = doc.senderidSMS
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.status = 'Sent'
                                    data.reason = response.SMSMessageData.Message
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    Basic.findByIdAndRemove(doc.id, function (err) {
                                        console.log('Deleted')
                                    })
                                }
                                else {
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    Basic.findByIdAndRemove(doc.id, function (err) {
                                        console.log('Deleted')
                                    })


                                }

                            })
                            .catch((error) => {
                                console.log(error)


                            });
                    }
                    else {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId
                            from: doc.senderidSMS
                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message === 'InvalidSenderId') {

                                    console.log(response)
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                }
                                else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            var message = user.messages + 1
                                            data.messages = message
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.sender = doc.senderidSMS
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.status = 'Sent'
                                    data.reason = response.SMSMessageData.Message
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    Basic.findByIdAndRemove(doc.id, function (err) {
                                        console.log('Deleted')
                                    })
                                }
                                else {

                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    Basic.findByIdAndRemove(doc.id, function (err) {
                                        console.log('Deleted')
                                    })
                                }


                            })
                            .catch((error) => {
                                console.log(error);

                            });
                    }

                }

                sendMessage1();
            })

        }

        else if (doc.typeMessage === 'Bulk') {
            var customerCursor = Customer.find({ userID: doc.userID }).cursor();
            customerCursor.on('data', function (doc2) {


                function sendMessage1() {
                    if (doc.senderidSMS === '') {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId

                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.sender = doc.senderidSMS
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.status = 'Sent'
                                    data.reason = response.SMSMessageData.Message
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    Basic.findByIdAndRemove(doc.id, function (err) {
                                        console.log('Deleted')
                                    })
                                }
                                else {
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    Basic.findByIdAndRemove(doc.id, function (err) {
                                        console.log('Deleted')
                                    })


                                }

                            })
                            .catch((error) => {
                                console.log(error)


                            });
                    }
                    else {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId
                            from: doc.senderidSMS
                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message === 'InvalidSenderId') {

                                    console.log(response)
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                }
                                else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            var message = user.messages + 1
                                            data.messages = message
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.sender = doc.senderidSMS
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.status = 'Sent'
                                    data.reason = response.SMSMessageData.Message
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    Basic.findByIdAndRemove(doc.id, function (err) {
                                        console.log('Deleted')
                                    })
                                }
                                else {

                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    Basic.findByIdAndRemove(doc.id, function (err) {
                                        console.log('Deleted')
                                    })
                                }


                            })
                            .catch((error) => {
                                console.log(error);

                            });
                    }

                }

                sendMessage1();
            })

        }
        else {
            console.log('Failed')
        }




    })


}


// ------- BASIC COMPLETE ----------


//----------- Daily Reminder --------------------------------


function DailyReminder() {
    var date = new Date();
    var hour = ('0' + date.getHours()).slice(-2);
    var min = ('0' + date.getMinutes()).slice(-2);
    var sec = date.getSeconds();
    var year = date.getFullYear();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    //2019-11-14/04:56
    var time = year + "-" + month + "-" + day + "/" + hour + ":" + min;
    var dailyCursor = Daily.find({ 'account': true, 'scheduleddate': time }).cursor();
    dailyCursor.on('data', function (doc) {
        console.log('DONE')
        const credentials = {
            apiKey: doc.apikeySMS,
            username: doc.usernameSMS,
        }
        const AfricasTalking = require('africastalking')(credentials);

        // Get the SMS service
        const sms = AfricasTalking.SMS;


        if (doc.typeMessage === 'Individual') {
            function sendMessage() {
                if (doc.senderidSMS === '') {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: doc.message,
                        // Set your shortCode or senderId

                    }

                    // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                    sms.send(options)
                        .then((response) => {
                            if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                User.findById(doc.userID, function (err, user) {
                                    {

                                        var query = { _id: user.id };
                                        var data = {}
                                        var add = user.amount + 7;
                                        var message = user.messages + 1
                                        data.messages = message
                                        data.amount = add;
                                        User.update(query, data, function () { console.log('Added successfully') })
                                    }
                                })
                                console.log(response)
                                var data = new History();
                                data.userID = doc.userID;
                                data.sender = doc.senderidSMS
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.status = 'Sent'
                                data.reason = response.SMSMessageData.Message
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                Daily.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })

                            }
                            else {
                                console.log(response)
                                var data = new History();
                                data.userID = doc.userID;
                                data.phone = doc.phone;
                                data.sender = doc.senderidSMS
                                data.group = doc.group
                                data.status = 'Not Sent';
                                data.reason = response.SMSMessageData.Message
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                Daily.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })
                            }



                        })
                        .catch((error) => {
                            console.log(error)

                        });
                }
                else {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: doc.message,
                        // Set your shortCode or senderId
                        from: doc.senderidSMS
                    }

                    // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                    sms.send(options)
                        .then((response) => {
                            if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                var data = new History();
                                data.userID = doc.userID;
                                data.phone = doc.phone;
                                data.sender = doc.senderidSMS
                                data.group = doc.group
                                data.status = 'Not Sent';
                                data.reason = response.SMSMessageData.Message
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                Daily.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })
                            }
                            else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                User.findById(doc.userID, function (err, user) {
                                    {

                                        var query = { _id: user.id };
                                        var data = {}
                                        var add = user.amount + 7;
                                        var message = user.messages + 1
                                        data.messages = message
                                        data.amount = add;
                                        User.update(query, data, function () { console.log('Added successfully') })
                                    }
                                })
                                var data = new History();
                                data.userID = doc.userID;
                                data.sender = doc.senderidSMS
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.status = 'Sent'
                                data.reason = response.SMSMessageData.Message
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                Daily.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })
                            }
                            else {
                                var data = new History();
                                data.userID = doc.userID;
                                data.phone = doc.phone;
                                data.sender = doc.senderidSMS
                                data.group = doc.group
                                data.status = 'Not Sent';
                                data.reason = response.SMSMessageData.Message
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                Daily.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })

                            }


                        })
                        .catch((error) => {
                            console.log(error)

                        });
                }

            }

            sendMessage();
        }
        // DAILY BASIC
        else if (doc.typeMessage === 'Group') {
            var customerCursor = Customer.find({ userID: doc.userID, group: doc.group }).cursor();
            customerCursor.on('data', function (doc2) {


                function sendMessage1() {
                    if (doc.senderidSMS === '') {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId

                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var message = user.messages + 1
                                            data.messages = message
                                            var add = user.amount + 7;
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.sender = doc.senderidSMS
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.status = 'Sent'
                                    data.reason = response.SMSMessageData.Message
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }
                                else {
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }




                            })
                            .catch((error) => {
                                console.log(error)


                            });
                    }
                    else {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId
                            from: doc.senderidSMS
                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }
                                else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            var message = user.messages + 1
                                            data.messages = message
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.sender = doc.senderidSMS
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.status = 'Sent'
                                    data.reason = response.SMSMessageData.Message
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }
                                else {

                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })

                                }


                            })
                            .catch((error) => {
                                console.log(error);

                            });
                    }

                }

                sendMessage1();
            })

        }

        else if (doc.typeMessage === 'Bulk') {
            var customerCursor = Customer.find({ userID: doc.userID }).cursor();
            customerCursor.on('data', function (doc2) {


                function sendMessage1() {
                    if (doc.senderidSMS === '') {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId

                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var message = user.messages + 1
                                            data.messages = message
                                            var add = user.amount + 7;
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.sender = doc.senderidSMS
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.status = 'Sent'
                                    data.reason = response.SMSMessageData.Message
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }
                                else {
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }




                            })
                            .catch((error) => {
                                console.log(error)


                            });
                    }
                    else {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId
                            from: doc.senderidSMS
                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })

                                    console.log(response)
                                }
                                else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            var message = user.messages + 1
                                            data.messages = message
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.sender = doc.senderidSMS
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.status = 'Sent'
                                    data.reason = response.SMSMessageData.Message
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }
                                else {

                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.sender = doc.senderidSMS
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    dataupdate.scheduleddate = addDays(doc.every) + "/" + doc.time;
                                    Daily.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })

                                }


                            })
                            .catch((error) => {
                                console.log(error);

                            });
                    }

                }

                sendMessage1();
            })

        }
        else {
            console.log('Failed')
        }

    })
}
//--------------DELETE DAILY------------------------------
function deleteDaily() {
    var date = new Date();
    var hour = ('0' + date.getHours()).slice(-2);
    var min = ('0' + date.getMinutes()).slice(-2);
    var sec = date.getSeconds();
    var year = date.getFullYear();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    //2019-11-14/04:56
    var time = year + "-" + month + "-" + day + "/" + hour + ":" + min;
    var dailydeleteCursor = Daily.find({ 'finaldate': time }).cursor();
    dailydeleteCursor.on('data', function (doc) {
        Daily.findByIdAndRemove(doc.id, function (err) {
            console.log('Removed')
        })
    })
}
// -------------- DAILY COMPLETE -----------------------------


//------------ Weekly Reminder ------------------------------

function WeeklyReminder() {
    var date = new Date();


    var hour = ('0' + date.getHours()).slice(-2);
    var min = ('0' + date.getMinutes()).slice(-2);
    var sec = date.getSeconds();
    var year = date.getFullYear();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    //2019-11-14/04:56
    var time = hour + ":" + min;
    console.log(time)

    var weeklyCursor = Weekly.find({ 'account': true, 'time': time }).cursor();
    weeklyCursor.on('data', function (doc) {
        const arr = doc.weeks;


        if (arr instanceof Array) {
            var d = new Date();
            var today = d.getDay();
            const result = arr.filter(number => parseFloat(number) === today);
            if (result.length > 0) {
                const credentials = {
                    apiKey: doc.apikeySMS,
                    username: doc.usernameSMS,
                }
                const AfricasTalking = require('africastalking')(credentials);

                // Get the SMS service
                const sms = AfricasTalking.SMS;


                if (doc.typeMessage === 'Individual') {
                    function sendMessage() {
                        if (doc.senderidSMS === '') {
                            const options = {
                                // Set the numbers you want to send to in international format
                                to: '+' + doc.phone,
                                // Set your message
                                message: doc.message,
                                // Set your shortCode or senderId

                            }

                            // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                            sms.send(options)
                                .then((response) => {
                                    if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                        User.findById(doc.userID, function (err, user) {
                                            {

                                                var query = { _id: user.id };
                                                var data = {}
                                                var add = user.amount + 7;
                                                var message = user.messages + 1
                                                data.messages = message
                                                data.amount = add;
                                                User.update(query, data, function () { console.log('Added successfully') })
                                            }
                                        })
                                        console.log(response)
                                        var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                    }
                                    else {
                                        console.log(response)
                                        var data = new History();
                                        data.userID = doc.userID;
                                        data.phone = doc.phone;
                                        data.group = doc.group
                                        data.status = 'Not Sent';
                                        data.sender = doc.senderidSMS
                                        data.reason = response.SMSMessageData.Message
                                        data.createdOn = doc.createdOn;
                                        data.sendOn = timeHistory
                                        data.typeMessage = doc.typeMessage;
                                        data.message = doc.message;
                                        data.save(function (err) {
                                            console.log('Saved to history')
                                        })
                                    }




                                })
                                .catch((error) => {
                                    console.log(error)

                                });
                        }
                        else {
                            const options = {
                                // Set the numbers you want to send to in international format
                                to: '+' + doc.phone,
                                // Set your message
                                message: doc.message,
                                // Set your shortCode or senderId
                                from: doc.senderidSMS
                            }

                            // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                            sms.send(options)
                                .then((response) => {
                                    if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                        var data = new History();
                                        data.userID = doc.userID;
                                        data.phone = doc.phone;
                                        data.group = doc.group
                                        data.status = 'Not Sent';
                                        data.sender = doc.senderidSMS
                                        data.reason = response.SMSMessageData.Message
                                        data.createdOn = doc.createdOn;
                                        data.sendOn = timeHistory
                                        data.typeMessage = doc.typeMessage;
                                        data.message = doc.message;
                                        data.save(function (err) {
                                            console.log('Saved to history')
                                        })
                                        console.log(response)
                                    }
                                    else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                        User.findById(doc.userID, function (err, user) {
                                            {

                                                var query = { _id: user.id };
                                                var data = {}
                                                var add = user.amount + 7;
                                                var message = user.messages + 1
                                                data.messages = message
                                                data.amount = add;
                                                User.update(query, data, function () { console.log('Added successfully') })
                                            }
                                        })
                                        var data = new History();
                                        data.userID = doc.userID;
                                        data.sender = doc.senderidSMS
                                        data.phone = doc.phone;
                                        data.group = doc.group
                                        data.createdOn = doc.createdOn;
                                        data.sendOn = timeHistory
                                        data.typeMessage = doc.typeMessage;
                                        data.message = doc.message;
                                        data.status = 'Sent'
                                        data.reason = response.SMSMessageData.Message
                                        data.save(function (err) {
                                            console.log('Saved to history')
                                        })
                                    }
                                    else {
                                        var data = new History();
                                data.userID = doc.userID;
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.status = 'Not Sent';
                                data.sender = doc.senderidSMS
                                data.reason = response.SMSMessageData.Message
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })


                                    }


                                })
                                .catch((error) => {
                                    console.log(error)

                                });
                        }

                    }

                    sendMessage();
                }
                // BULK BASIC
                else if(doc.typeMessage==='Group')
                {
                    var customerCursor = Customer.find({ userID: doc.userID ,group:doc.group}).cursor();
                    customerCursor.on('data', function (doc2) {


                        function sendMessage1() {
                            if (doc.senderidSMS === '') {
                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc2.phone,
                                    // Set your message
                                    message: doc.message,
                                    // Set your shortCode or senderId

                                }

                                // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            User.findById(doc.userID, function (err, user) {
                                                {

                                                    var query = { _id: user.id };
                                                    var data = {}
                                                    var add = user.amount + 7;
                                                    var message = user.messages + 1
                                                    data.messages = message
                                                    data.amount = add;
                                                    User.update(query, data, function () { console.log('Added successfully') })
                                                }
                                            })
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                        }
                                        else {
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                        }




                                    })
                                    .catch((error) => {
                                        console.log(error)


                                    });
                            }
                            else {
                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc2.phone,
                                    // Set your message
                                    message: doc.message,
                                    // Set your shortCode or senderId
                                    from: doc.senderidSMS
                                }

                                // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })

                                            console.log(response)
                                        }
                                        else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            User.findById(doc.userID, function (err, user) {
                                                {

                                                    var query = { _id: user.id };
                                                    var data = {}
                                                    var add = user.amount + 7;
                                                    var message = user.messages + 1
                                                    data.messages = message
                                                    data.amount = add;
                                                    User.update(query, data, function () { console.log('Added successfully') })
                                                }
                                            })
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                        }
                                        else {

                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })


                                        }


                                    })
                                    .catch((error) => {
                                        console.log(error);

                                    });
                            }

                        }

                        sendMessage1();
                    })

                }
                else if (doc.typeMessage === 'Bulk') {
                    var customerCursor = Customer.find({ userID: doc.userID }).cursor();
                    customerCursor.on('data', function (doc2) {


                        function sendMessage1() {
                            if (doc.senderidSMS === '') {
                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc2.phone,
                                    // Set your message
                                    message: doc.message,
                                    // Set your shortCode or senderId

                                }

                                // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            User.findById(doc.userID, function (err, user) {
                                                {

                                                    var query = { _id: user.id };
                                                    var data = {}
                                                    var add = user.amount + 7;
                                                    var message = user.messages + 1
                                                    data.messages = message
                                                    data.amount = add;
                                                    User.update(query, data, function () { console.log('Added successfully') })
                                                }
                                            })
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                        }
                                        else {
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                        }




                                    })
                                    .catch((error) => {
                                        console.log(error)


                                    });
                            }
                            else {
                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc2.phone,
                                    // Set your message
                                    message: doc.message,
                                    // Set your shortCode or senderId
                                    from: doc.senderidSMS
                                }

                                // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                            console.log(response)
                                        }
                                        else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            User.findById(doc.userID, function (err, user) {
                                                {

                                                    var query = { _id: user.id };
                                                    var data = {}
                                                    var add = user.amount + 7;
                                                    var message = user.messages + 1
                                                    data.messages = message
                                                    data.amount = add;
                                                    User.update(query, data, function () { console.log('Added successfully') })
                                                }
                                            })
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                        }
                                        else {

                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })


                                        }


                                    })
                                    .catch((error) => {
                                        console.log(error);

                                    });
                            }

                        }

                        sendMessage1();
                    })

                }
                else {
                    console.log('Failed')
                }

            }
            else {
                console.log('Continue....')
            }

        }
        // ------- Second
        else {
            var d = new Date();
            var today = d.getDay();
            if (parseFloat(arr) === today) {
                const credentials = {
                    apiKey: doc.apikeySMS,
                    username: doc.usernameSMS,
                }
                const AfricasTalking = require('africastalking')(credentials);

                // Get the SMS service
                const sms = AfricasTalking.SMS;


                if (doc.typeMessage === 'Individual') {
                    function sendMessage() {
                        if (doc.senderidSMS === '') {
                            const options = {
                                // Set the numbers you want to send to in international format
                                to: '+' + doc.phone,
                                // Set your message
                                message: doc.message,
                                // Set your shortCode or senderId

                            }

                            // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                            sms.send(options)
                                .then((response) => {
                                    if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                        User.findById(doc.userID, function (err, user) {
                                            {

                                                var query = { _id: user.id };
                                                var data = {}
                                                var add = user.amount + 7;
                                                var message = user.messages + 1
                                                data.messages = message
                                                data.amount = add;
                                                User.update(query, data, function () { console.log('Added successfully') })
                                            }
                                        })
                                        console.log(response)
                                        var data = new History();
                                        data.userID = doc.userID;
                                        data.sender = doc.senderidSMS
                                        data.phone = doc.phone;
                                        data.group = doc.group
                                        data.createdOn = doc.createdOn;
                                        data.sendOn = timeHistory
                                        data.typeMessage = doc.typeMessage;
                                        data.message = doc.message;
                                        data.status = 'Sent'
                                        data.reason = response.SMSMessageData.Message
                                        data.save(function (err) {
                                            console.log('Saved to history')
                                        })
                                    }
                                    else {
                                        console.log(response)
                                        var data = new History();
                                        data.userID = doc.userID;
                                        data.phone = doc.phone;
                                        data.group = doc.group
                                        data.status = 'Not Sent';
                                        data.sender = doc.senderidSMS
                                        data.reason = response.SMSMessageData.Message
                                        data.createdOn = doc.createdOn;
                                        data.sendOn = timeHistory
                                        data.typeMessage = doc.typeMessage;
                                        data.message = doc.message;
                                        data.save(function (err) {
                                            console.log('Saved to history')
                                        })
                                    }




                                })
                                .catch((error) => {
                                    console.log(error)

                                });
                        }
                        else {
                            const options = {
                                // Set the numbers you want to send to in international format
                                to: '+' + doc.phone,
                                // Set your message
                                message: doc.message,
                                // Set your shortCode or senderId
                                from: doc.senderidSMS
                            }

                            // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                            sms.send(options)
                                .then((response) => {
                                    if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                        var data = new History();
                                        data.userID = doc.userID;
                                        data.phone = doc.phone;
                                        data.group = doc.group
                                        data.status = 'Not Sent';
                                        data.sender = doc.senderidSMS
                                        data.reason = response.SMSMessageData.Message
                                        data.createdOn = doc.createdOn;
                                        data.sendOn = timeHistory
                                        data.typeMessage = doc.typeMessage;
                                        data.message = doc.message;
                                        data.save(function (err) {
                                            console.log('Saved to history')
                                        })
                                        console.log(response)
                                    }
                                    else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                        User.findById(doc.userID, function (err, user) {
                                            {

                                                var query = { _id: user.id };
                                                var data = {}
                                                var add = user.amount + 7;
                                                var message = user.messages + 1
                                                data.messages = message
                                                data.amount = add;
                                                User.update(query, data, function () { console.log('Added successfully') })
                                            }
                                        })
                                        var data = new History();
                                        data.userID = doc.userID;
                                        data.sender = doc.senderidSMS
                                        data.phone = doc.phone;
                                        data.group = doc.group
                                        data.createdOn = doc.createdOn;
                                        data.sendOn = timeHistory
                                        data.typeMessage = doc.typeMessage;
                                        data.message = doc.message;
                                        data.status = 'Sent'
                                        data.reason = response.SMSMessageData.Message
                                        data.save(function (err) {
                                            console.log('Saved to history')
                                        })
                                    }
                                    else {
                                        var data = new History();
                                        data.userID = doc.userID;
                                        data.phone = doc.phone;
                                        data.group = doc.group
                                        data.status = 'Not Sent';
                                        data.sender = doc.senderidSMS
                                        data.reason = response.SMSMessageData.Message
                                        data.createdOn = doc.createdOn;
                                        data.sendOn = timeHistory
                                        data.typeMessage = doc.typeMessage;
                                        data.message = doc.message;
                                        data.save(function (err) {
                                            console.log('Saved to history')
                                        })


                                    }


                                })
                                .catch((error) => {
                                    console.log(error)

                                });
                        }

                    }

                    sendMessage();
                }
                // BULK BASIC

                else if (doc.typeMessage === 'Bulk') {
                    var customerCursor = Customer.find({ userID: doc.userID }).cursor();
                    customerCursor.on('data', function (doc2) {


                        function sendMessage1() {
                            if (doc.senderidSMS === '') {
                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc2.phone,
                                    // Set your message
                                    message: doc.message,
                                    // Set your shortCode or senderId

                                }

                                // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            User.findById(doc.userID, function (err, user) {
                                                {

                                                    var query = { _id: user.id };
                                                    var data = {}
                                                    var add = user.amount + 7;
                                                    var message = user.messages + 1
                                                    data.messages = message
                                                    data.amount = add;
                                                    User.update(query, data, function () { console.log('Added successfully') })
                                                }
                                            })
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                        }
                                        else {
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                        }




                                    })
                                    .catch((error) => {
                                        console.log(error)


                                    });
                            }
                            else {
                                const options = {
                                    // Set the numbers you want to send to in international format
                                    to: '+' + doc2.phone,
                                    // Set your message
                                    message: doc.message,
                                    // Set your shortCode or senderId
                                    from: doc.senderidSMS
                                }

                                // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                                sms.send(options)
                                    .then((response) => {
                                        if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })

                                            console.log(response)
                                        }
                                        else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                            User.findById(doc.userID, function (err, user) {
                                                {

                                                    var query = { _id: user.id };
                                                    var data = {}
                                                    var add = user.amount + 7;
                                                    var message = user.messages + 1
                                                    data.messages = message
                                                    data.amount = add;
                                                    User.update(query, data, function () { console.log('Added successfully') })
                                                }
                                            })
                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                        }
                                        else {

                                            var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })


                                        }


                                    })
                                    .catch((error) => {
                                        console.log(error);

                                    });
                            }

                        }

                        sendMessage1();
                    })

                }
                else {
                    console.log('Failed')
                }
            }
        }




    })
}







//---------------Delete Weekly-------------------------
function deleteWeekly() {
    var date = new Date();
    var hour = ('0' + date.getHours()).slice(-2);
    var min = ('0' + date.getMinutes()).slice(-2);
    var sec = date.getSeconds();
    var year = date.getFullYear();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    //2019-11-14/04:56
    var time = year + "-" + month + "-" + day + "/" + hour + ":" + min;
    var weeklydeleteCursor = Weekly.find({ 'finaldate': time }).cursor();
    weeklydeleteCursor.on('data', function (doc) {
        Weekly.findByIdAndRemove(doc.id, function (err) {
            console.log('Removed')
        })
    })
}


//---------------Monthly Reminder ----------------------------

function MonthlyReminder() {
    var date = new Date();
    var hour = ('0' + date.getHours()).slice(-2);
    var min = ('0' + date.getMinutes()).slice(-2);
    var sec = date.getSeconds();
    var year = date.getFullYear();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    //2019-11-14/04:56
    var time = year + "-" + month + "-" + day + "/" + hour + ":" + min;
    var monthlyCursor = Monthly.find({ 'account': true, 'scheduleddate': time }).cursor();
    monthlyCursor.on('data', function (doc) {
        console.log('DONE')
        const credentials = {
            apiKey: doc.apikeySMS,
            username: doc.usernameSMS,
        }
        const AfricasTalking = require('africastalking')(credentials);

        // Get the SMS service
        const sms = AfricasTalking.SMS;


        if (doc.typeMessage === 'Individual') {
            function sendMessage() {
                if (doc.senderidSMS === '') {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: doc.message,
                        // Set your shortCode or senderId

                    }

                    // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                    sms.send(options)
                        .then((response) => {
                            if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                User.findById(doc.userID, function (err, user) {
                                    {

                                        var query = { _id: user.id };
                                        var data = {}
                                        var add = user.amount + 7;
                                        var message = user.messages + 1
                                        data.messages = message
                                        data.amount = add;
                                        User.update(query, data, function () { console.log('Added successfully') })
                                    }
                                })
                                console.log(response)
                                var data = new History();
                                data.userID = doc.userID;
                                data.sender = doc.senderidSMS
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.status = 'Sent'
                                data.reason = response.SMSMessageData.Message
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                var dayss = doc.every * 30

                                dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                Monthly.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })
                            }
                            else {
                                console.log(response)
                                var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                var dayss = doc.every * 30

                                dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                Monthly.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })
                            }



                        })
                        .catch((error) => {
                            console.log(error)

                        });
                }
                else {
                    const options = {
                        // Set the numbers you want to send to in international format
                        to: '+' + doc.phone,
                        // Set your message
                        message: doc.message,
                        // Set your shortCode or senderId
                        from: doc.senderidSMS
                    }

                    // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                    sms.send(options)
                        .then((response) => {
                            if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                var data = new History();
                                data.userID = doc.userID;
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.status = 'Not Sent';
                                data.sender = doc.senderidSMS
                                data.reason = response.SMSMessageData.Message
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                var dayss = doc.every * 30

                                dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                Monthly.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })
                                console.log(response)
                            }
                            else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                User.findById(doc.userID, function (err, user) {
                                    {

                                        var query = { _id: user.id };
                                        var data = {}
                                        var add = user.amount + 7;
                                        var message = user.messages + 1
                                        data.messages = message
                                        data.amount = add;
                                        User.update(query, data, function () { console.log('Added successfully') })
                                    }
                                })
                                var data = new History();
                                data.userID = doc.userID;
                                data.sender = doc.senderidSMS
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.status = 'Sent'
                                data.reason = response.SMSMessageData.Message
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                var dayss = doc.every * 30

                                dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                Monthly.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })
                            }
                            else {
                                var data = new History();
                                data.userID = doc.userID;
                                data.phone = doc.phone;
                                data.group = doc.group
                                data.status = 'Not Sent';
                                data.sender = doc.senderidSMS
                                data.reason = response.SMSMessageData.Message
                                data.createdOn = doc.createdOn;
                                data.sendOn = timeHistory
                                data.typeMessage = doc.typeMessage;
                                data.message = doc.message;
                                data.save(function (err) {
                                    console.log('Saved to history')
                                })
                                var query = {
                                    _id: doc.id
                                };
                                var dataupdate = {};
                                function addDays(n) {
                                    var t = new Date();
                                    t.setDate(t.getDate() + n);
                                    var month = "0" + (t.getMonth() + 1);
                                    var date = "0" + t.getDate();
                                    month = month.slice(-2);
                                    date = date.slice(-2);
                                    var date = t.getFullYear() + '-' + month + "-" + date;
                                    return date;
                                }

                                var dayss = doc.every * 30

                                dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                Monthly.update(query, dataupdate, function (err) {
                                    console.log('daily updated')
                                })

                            }


                        })
                        .catch((error) => {
                            console.log(error)

                        });
                }

            }

            sendMessage();
        }
        // BULK BASIC
        else if(doc.typeMessage==='Group')
        {
            var customerCursor = Customer.find({ userID: doc.userID ,group:doc.group}).cursor();
            customerCursor.on('data', function (doc2) {


                function sendMessage1() {
                    if (doc.senderidSMS === '') {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId

                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            var message = user.messages + 1
                                            data.messages = message
                                            data.amount = add;

                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }
                                else {
                                    var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }



                            })
                            .catch((error) => {
                                console.log(error)


                            });
                    }
                    else {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId
                            from: doc.senderidSMS
                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.sender = doc.senderidSMS
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })

                                    console.log(response)
                                }
                                else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }
                                else {

                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.sender = doc.senderidSMS
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })

                                }


                            })
                            .catch((error) => {
                                console.log(error);

                            });
                    }

                }

                sendMessage1();
            })
        }
        else if (doc.typeMessage === 'Bulk') {
            var customerCursor = Customer.find({ userID: doc.userID }).cursor();
            customerCursor.on('data', function (doc2) {


                function sendMessage1() {
                    if (doc.senderidSMS === '') {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId

                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            var message = user.messages + 1
                                            data.messages = message
                                            data.amount = add;

                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.sender = doc.senderidSMS
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.status = 'Sent'
                                    data.reason = response.SMSMessageData.Message
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }
                                else {
                                    var data = new History();
                                    data.userID = doc.userID;
                                    data.phone = doc.phone;
                                    data.group = doc.group
                                    data.status = 'Not Sent';
                                    data.sender = doc.senderidSMS
                                    data.reason = response.SMSMessageData.Message
                                    data.createdOn = doc.createdOn;
                                    data.sendOn = timeHistory
                                    data.typeMessage = doc.typeMessage;
                                    data.message = doc.message;
                                    data.save(function (err) {
                                        console.log('Saved to history')
                                    })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }



                            })
                            .catch((error) => {
                                console.log(error)


                            });
                    }
                    else {
                        const options = {
                            // Set the numbers you want to send to in international format
                            to: '+' + doc2.phone,
                            // Set your message
                            message: doc.message,
                            // Set your shortCode or senderId
                            from: doc.senderidSMS
                        }

                        // Thatâ€™s it, hit send and weâ€™ll take care of the rest
                        sms.send(options)
                            .then((response) => {
                                if (response.SMSMessageData.Message === 'InvalidSenderId') {
                                    var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                    console.log(response)
                                }
                                else if (response.SMSMessageData.Message !== 'Sent to 0/1 Total Cost: 0') {
                                    User.findById(doc.userID, function (err, user) {
                                        {

                                            var query = { _id: user.id };
                                            var data = {}
                                            var add = user.amount + 7;
                                            data.amount = add;
                                            User.update(query, data, function () { console.log('Added successfully') })
                                        }
                                    })
                                    var data = new History();
                                            data.userID = doc.userID;
                                            data.sender = doc.senderidSMS
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.status = 'Sent'
                                            data.reason = response.SMSMessageData.Message
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })
                                }
                                else {

                                    var data = new History();
                                            data.userID = doc.userID;
                                            data.phone = doc.phone;
                                            data.group = doc.group
                                            data.status = 'Not Sent';
                                            data.sender = doc.senderidSMS
                                            data.reason = response.SMSMessageData.Message
                                            data.createdOn = doc.createdOn;
                                            data.sendOn = timeHistory
                                            data.typeMessage = doc.typeMessage;
                                            data.message = doc.message;
                                            data.save(function (err) {
                                                console.log('Saved to history')
                                            })
                                    var query = {
                                        _id: doc.id
                                    };
                                    var dataupdate = {};
                                    function addDays(n) {
                                        var t = new Date();
                                        t.setDate(t.getDate() + n);
                                        var month = "0" + (t.getMonth() + 1);
                                        var date = "0" + t.getDate();
                                        month = month.slice(-2);
                                        date = date.slice(-2);
                                        var date = t.getFullYear() + '-' + month + "-" + date;
                                        return date;
                                    }

                                    var dayss = doc.every * 30

                                    dataupdate.scheduleddate = addDays(dayss) + "/" + doc.time;
                                    Monthly.update(query, dataupdate, function (err) {
                                        console.log('daily updated')
                                    })

                                }


                            })
                            .catch((error) => {
                                console.log(error);

                            });
                    }

                }

                sendMessage1();
            })

        }
        else {
            console.log('Failed')
        }

    })
}





//---------------Delete Monthly-------------------------
function deleteMonthly() {
    var date = new Date();
    var hour = ('0' + date.getHours()).slice(-2);
    var min = ('0' + date.getMinutes()).slice(-2);
    var sec = date.getSeconds();
    var year = date.getFullYear();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    //2019-11-14/04:56
    var time = year + "-" + month + "-" + day + "/" + hour + ":" + min;
    var monthlydeleteCursor = Monthly.find({ 'finaldate': time }).cursor();
    monthlydeleteCursor.on('data', function (doc) {
        Monthly.findByIdAndRemove(doc.id, function (err) {
            console.log('Removed')
        })
    })
}

//--------------Monthly Complete ----------------------------------

// End of Reminders

var j = schedule.scheduleJob('* * * * *', function () {
    Basicc()
    DailyReminder();
    deleteDaily()
    MonthlyReminder();
    deleteMonthly();
    WeeklyReminder();
    deleteWeekly();
    console.log('hello')

});
app.listen(process.env.PORT || 5000, function () {
    console.log('app is running on port 5000')
})
