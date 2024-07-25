const mongoose = require('mongoose');

const groupChatSchema = new mongoose.Schema({
    conversationname : {type : String, default : ''},
    groupParticipants: [{userid : {type : String}, linxname : {type : String}}],
    roomkey : {type : String, unique : true},
    messages: [
        {
            isRead : {type : Boolean , default : false},
            text: { type: String, maxLength: 300, minLength: 1 },
            timestamp: { type: Date },
            sender: { 
                userid : {type: String, unique : false},
                linxname : {type : String} 
            }
        }
    ]
})

module.exports = mongoose.model('GroupChat', groupChatSchema, 'GroupChats');