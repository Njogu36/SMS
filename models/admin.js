var mongoose = require('mongoose');
var adminSchema = mongoose.Schema({

   
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
    }

})
var Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
