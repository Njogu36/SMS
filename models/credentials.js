var mongoose = require('mongoose');
var credentialsSchema = mongoose.Schema({
    username: {
        type: String
    },
    apiKey: {
        type: String
    },
    senderID: {
        type: String
    }
})
var Credentials = mongoose.model('Credentials', credentialsSchema);
module.exports = Credentials;
