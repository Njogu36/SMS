var mongoose = require('mongoose');
var groupSchema = mongoose.Schema({

   
    name: {
        type: String
    },
    count: {
        type: Number
    },
    userID:
    {
        type:String
    }
    

})
var Group = mongoose.model('Group', groupSchema);
module.exports = Group;
