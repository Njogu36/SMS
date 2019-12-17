var mongoose = require('mongoose');
var reminderSchema = mongoose.Schema({

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
    endTIme: {
        type: String
    },
    message: {
        type: String
    },
    userID:
    {
        type:String
    }

})
var Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = Reminder;
