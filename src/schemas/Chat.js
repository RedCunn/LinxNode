const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    name : {type : String, default : ''},
    participants: {
        userid_a: {type : String, unique : false},
        userid_b: { type : String, unique : false}
    },
    roomkey : {type : String, unique : true},
    messages: [
        {
            isRead : {type : Boolean , default : false},
            text: { type: String, maxLength: 300, minLength: 1 },
            timestamp: { type: Date },
            sender: { 
                userid : {type: String, unique : false},
                linxname : {type : String} 
            },
            to:{type : String}
        }
    ]
})

module.exports = mongoose.model('Chat', chatSchema, 'Chats');