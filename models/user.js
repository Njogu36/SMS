var mongoose = require('mongoose');
var userSchema = mongoose.Schema({

    companyname: {
        type: String
    },
    fullname: {
        type: String
    },
    username: {
        type: String
    },
    email: {
        type: String
    },
    password:
    {
        type:String
    },
    atBalance:
    {
        type:String
    },
    usernameSMS: {
        type: String
    },
    atAmount:{
        type:String
    },
    apikeySMS: {
        type: String
    },
    senderidSMS: {
        type: String
    },
    account:
    {
type:Boolean
    },
    amount:
    {
        type:Number
    },
    messages:
    {type:Number}

})
var User = mongoose.model('User', userSchema);
module.exports = User;
