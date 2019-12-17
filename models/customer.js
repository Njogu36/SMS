var mongoose = require('mongoose');
var customerSchema = mongoose.Schema({

    firstname: {
        type: String
    },
    lastname: {
        type: String
    },
    phone: {
        type: String
    },
    userID:
    {
        type:String
    },
    group:
    {
        type:String
    }

})
var Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
