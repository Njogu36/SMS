var mongoose = require('mongoose');
var historySchema = mongoose.Schema({

    phone: {
        type: String
    },
    typeMessage:
    {
        type:String
    },
    createdOn:{
        type:String
    },
    sendOn: {
        type: String
    },
    message: {
        type: String
    },
    userID:
    {
        type:String
    },
    sender:
    {
        type:String
    },
    group:
    {
        type:String
    },
    reason:
    {
        type:String
    },
    status:
    {
        type:String
    }

})
var History = mongoose.model('History', historySchema);
module.exports = History;
