var mongoose = require('mongoose');
var senderSchema = mongoose.Schema({

   
    name: {
        type: String
    },
    userID: {
        type: String
    },
    

})
var Sender = mongoose.model('Sender', senderSchema);
module.exports = Sender;
