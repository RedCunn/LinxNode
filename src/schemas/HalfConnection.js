const mongoose = require('mongoose');

let HalfConnectionSchema = new mongoose.Schema ({
    madeAt : {type : Date, default : Date.now},
    initiator: { type : String},
    receiver: {type : String}
})

module.exports = mongoose.model('HalfConnection', HalfConnectionSchema , 'HalfConnections');

