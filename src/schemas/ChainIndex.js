const mongoose = require('mongoose');

let chainIndexSchema = new mongoose.Schema({
    createdAt : {type : Date},
    chainAdminsID: [{type: String}],
    chainID : {
        type: String,
        required: true
    },
    chainName : {
        type: String,
        required: true
    },
    userIDs: {
        type: [String],
        validate: {
            validator: function(arr) {
                return arr.length === new Set(arr).size;
            },
            message: 'Los valores en el array userIDs deben ser únicos.'
        }
    }
})

module.exports = mongoose.model('ChainIndex', chainIndexSchema, 'ChainIndexes');