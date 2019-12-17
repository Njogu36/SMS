var mongoose = require('mongoose');
var dailySchema = mongoose.Schema({

    phone: {
        type: String
    },
    group: {
        type: String
    },
    typeMessage:
    {
        type:String
    },
    createdOn:{
        type:Date
    },
    every:
    {
        type:Number
    },
    account:Boolean,
    time:
    {
        type:String
    },
    scheduleddate: {
        type: String
    },
    finaldate:{
        type:String
    },
    message: {
        type: String
    },
    userID:
    {
        type:String
    },
    senderidSMS:
    {
        type:String
    },
    usernameSMS:
    {
        type:String
    },
    apikeySMS:
    {
        type:String
    },
    status:
    {
        type:String
    }

})
var Daily = mongoose.model('Daily', dailySchema);
module.exports = Daily;
