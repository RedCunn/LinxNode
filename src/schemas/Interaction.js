const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    id: {type : String, unique : true},
    date: {type : Date, default : Date.now},
    type: {type : String},
    from: {type : String},
    to: {type : String},
    object : {type : mongoose.Schema.Types.Mixed}
});

module.exports = mongoose.model('Interaction', InteractionSchema, 'Interactions');