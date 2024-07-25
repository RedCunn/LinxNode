const mongoose = require('mongoose');

let ConnectionSchema = new mongoose.Schema ({
    connectedAt : {  type: Date,required: [true],default: Date.now},
    userid_a: { type : String},
    userid_b: { type : String},
    roomkey : {type: String}
})

module.exports = mongoose.model('Connection', ConnectionSchema, 'Connections');

