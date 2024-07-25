const mongoose = require('mongoose');

let HalfConnectionSchema = new mongoose.Schema ({
    initiator: { type : String},
    receiver: {type : String}
})

module.exports = mongoose.model('HalfConnection', HalfConnectionSchema , 'HalfConnections');

