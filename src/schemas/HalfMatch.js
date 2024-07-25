const mongoose = require('mongoose');

let HalfMatchSchema = new mongoose.Schema ({
    matchingUserid: { type : String},
    matchedUserid: {type : String}
})

module.exports = mongoose.model('HalfMatch', HalfMatchSchema, 'HalfMatches');

