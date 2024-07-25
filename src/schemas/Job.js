const mongoose = require('mongoose');

let JobSchema = new mongoose.Schema({
    refid : {type : String},
    task: {
        type: String,
        enum: ["delete_account", "send_email", "break_chain"],
        required: true
    },
    status : {type : String , required : true},
    createdAt : {type : Date , default : Date.now},
    payload : {
        refid : {type : String},
        code : {type : Number},
        subject : {type : String},
        address : {type : String},
        message : {type : String},
        data : {type : Array}
    }
})

module.exports = mongoose.model('Job', JobSchema, 'Jobs');