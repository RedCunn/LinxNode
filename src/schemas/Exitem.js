const mongoose = require('mongoose');

let exitemSchema = mongoose.Schema({
    userid : {type: String, required : [true, '*Necesitas un user_id que asociar a este exitem']},
    accountid: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' , required : [true, '*Necesitas un account_id que asociar a este evento']},
    postedAt : {
        type: Date,
        required : true,
        default : Date.now
    },
    available : {
        type : Boolean, 
        required : true,
        default : false
    },
    tags : [{tag : {type : String}}],
    name : {type : String, required : true,   maxLength : [60, '* Máx. número de caracteres 60']},
    description : {type : String,   maxLength : [300, '* Máx. número de caracteres 300']},
    picture : {type : String},
    wishList : [{wish : {type : String}, tags : [{tag : {type : String}}]}] 
})

module.exports = mongoose.model('Exitem', exitemSchema, 'Exitems');