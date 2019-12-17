var mongoose = require('mongoose');
var paymenySchema = mongoose.Schema({
    email:{
        type:String
    },
    amount:
    {
        type:Number
    },
    currency:
    {
        type:String
    },
    customerID:
    {
        type:String
    },
    flwRef:
    {
        type:String
    },
    fullname:
    {
        type:String
    },
    createdOn:
    {
        type:String
    },
    status:
    {
        type:String
    },
    userID:
    {
        type:String
    },
    paymentID:
    {
        type:String
    }
})
var Payment = mongoose.model('Payment',paymenySchema);
module.exports = Payment