const mongoose = require('mongoose');

let linxExtentSchema = new mongoose.Schema({
    chainadminID: {
        type: String,
        required: true
    },
    chainID : {
        type: String,
        required: true
    },
    mylinxuserID: {
        type: String,
        required: true
    },
    userid: {
        type: String,
        required: true
    },
    onChainSince: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = mongoose.model('LinxExtent', linxExtentSchema, 'LinxExtents');