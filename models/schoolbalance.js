var mongoose = require('mongoose');
var BalanceSchema = mongoose.Schema({
    userID:{
        type:String
    },
    phone:
    {
        type:String
    },
    fullname:
    {
        type:String
    },
    term:
    {
        type:String
    },
    class:{
        type:String
    },
    account:Boolean,
    amount:
    {
        type:Number
    },
    admissionNo:
    {
        type:String
    }
});
var Balance  = mongoose.model('Balance',BalanceSchema);
module.exports = Balance;