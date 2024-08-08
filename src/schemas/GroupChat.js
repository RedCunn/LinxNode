const mongoose = require('mongoose');

const groupChatSchema = new mongoose.Schema({
    name : {type : String, default : ''},
    chainId : {type : String, unique : true},
    groupParticipants: [{userid : {type : String}, linxname : {type : String}}],
    roomkey : {type : String, unique : true},
    messages: [
        {
            readBy : [{userid : {type : String}, isRead : {type : Boolean , default : false}}],
            text: { type: String, maxLength: 300, minLength: 1 },
            timestamp: { type: Date },
            sender: { 
                userid : {type: String, unique : false},
                linxname : {type : String} 
            },
            to: {type : String} 
        }
    ]
})

module.exports = mongoose.model('GroupChat', groupChatSchema, 'GroupChats');