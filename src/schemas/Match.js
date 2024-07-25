const mongoose = require('mongoose');

let MatchSchema = new mongoose.Schema ({
    matchedAt : {  type: Date,required: [true],default: Date.now},
    userid_a: { type : String},
    userid_b: { type : String},
    roomkey : {type: String}
})

module.exports = mongoose.model('Match', MatchSchema, 'Matches');

