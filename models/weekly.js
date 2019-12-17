var mongoose = require('mongoose');
var weeklySchema = mongoose.Schema({

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
    weeks:
    {
        type:Object
    },
    time:
    {
        type:String
    },
    finaldate:{
        type:String
    },
    account:Boolean,
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
var Weekly = mongoose.model('Weekly', weeklySchema);
module.exports = Weekly;
