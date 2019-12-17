var mongoose = require('mongoose');
var primarySchema = mongoose.Schema({
    phone:
    {
        type:String
    },
    admissionNo:
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
    account:Boolean,
    class:
    {
        type:String
    },
    
    Mathematics:
    {
        type:String
    },
    English:
    {
        type:String
    },
    Kiswahili:
    {
        type:String
    },
    Science:
    {
        type:String
    },
    ssre:
    {
        type:String
    },
    
    Total:
    {
        type:String
    },
    userID:
    {
        type:String
    },
    position:
    {
        type:Number
    }

})
var Primary = mongoose.model('Primary',primarySchema);
module.exports =  Primary