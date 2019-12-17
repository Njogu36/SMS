var mongoose = require('mongoose');
var templateSchema = mongoose.Schema({

   
    name: {
        type: String
    },
    userID: {
        type: String
    },
    message:
    {
        type:String
    },
    created_on:
    {
        type:Date
    }
    

})
var Template = mongoose.model('Template', templateSchema);
module.exports = Template;
