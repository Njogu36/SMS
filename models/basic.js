var mongoose = require('mongoose');
var basicSchema = mongoose.Schema({

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
    account:Boolean,
    scheduleddate: {
        type: String
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
var Basic = mongoose.model('Basic', basicSchema);
module.exports = Basic;
