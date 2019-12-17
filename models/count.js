var mongoose = require('mongoose');
var countSchema = mongoose.Schema({

   
    messages: {
        type: String
    },
    users: {
        type: String
    },
  

})
var Count = mongoose.model('Count', countSchema);
module.exports = Count;
