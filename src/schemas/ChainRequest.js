const mongoose = require('mongoose');

let ChainReqSchema = new mongoose.Schema ({
    requestingUserid: { type : String},
    requestedUserid: {type : String},
    chain : {
        chainid: {type : String},
        chainname : {type : String, default : 'Mejores amigxs'}
    },
    requestedAt : {type : Date, default : Date.now}
})

module.exports = mongoose.model('ChainRequest', ChainReqSchema, 'ChainRequests');