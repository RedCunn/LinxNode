const Chat = require('../schemas/Chat');
const GroupChat = require('../schemas/GroupChat');
const Account = require('../schemas/Account');
const Chain = require('../schemas/ChainIndex');

const createChat = async (chat) => {

    try {
        let insertChat = await Chat.create(chat);
        return insertChat;
    } catch (error) {
        console.log('ERROR CREATING NEW CHAT : ', error)
        return null;
    }
}
const createGroupChat = async (chat) => {

    try {
        let insertChat = await GroupChat.create();
    } catch (error) {
        console.log('ERROR CREATING NEW GROUPCHAT : ', error)
        return null;
    }
}

const checkChatExist = async (roomkey) => {
 
    try {
        let chatExists = await Chat.findOne({roomkey : roomkey})
        let groupChatExists = await GroupChat.findOne({roomkey : roomkey});

        if(chatExists !== null){
            return true;
        }else{
            if(groupChatExists !== null){
                return true;
            }else{
                return false;
            }
        }

    } catch (error) {
        console.log('ERROR FINDING CHAT AT CHECKCHATEXIST : ', error)
        return false;
    }
}

const getParticipants = async (userids) => {
    try {
        let participants = [];

        for (const id of userids) {
            const user = await Account.findOne({ userid: id });
            if (user) {
                participants.push({ userid: id, linxname: user.linxname });
            }
        }

        return participants;

    } catch (error) {
        console.log('ERROR creating GROUPCHAT AT getting GROUP CHAT PARTIciPANTS : ', error)
        return [];
    }
}

const getChainName = async (chainid) => {
    try {
        
        let chain = await Chain.findOne({chainId : chainid});

        if(chain){
            return chain;
        }else{
            return '';
        }
    } catch (error) {
        console.log('ERROR getting ChainName when Creating new GroupChat : ', error)
        return '';
    }
}

module.exports = {

    getChat : async(roomkey) => {

        try {
            let chat = await Chat.findOne({roomkey : roomkey});
            return chat;
        } catch (error) {
            console.log('error retrieving chat ... ', error)
        }
    },
    getChats : async(userid) => {

        try {
            let chats = [];
            let groupchats = [];

            chats = await Chat.find({$or : [{participants : {userid_a : userid}}, {participants : {userid_b : userid}}]});
            groupchats = await GroupChat.find({'groupParticipants.userid': { $in: [userid] }}).exec(); 

            return {chats, groupchats};
        } catch (error) {
            console.log('error retrieving user chats ... ', error)
        }
    },
    storeMessage: async (message, roomkey) => {
        try {
            let chatExists = await checkChatExist(roomkey);

            if (chatExists) {
                let updateResult = await Chat.findOneAndUpdate({roomkey : roomkey},{ $push: { messages: message  } }, {new : true})
                return updateResult;
            } else {
             
                let chat = {
                    participants : {
                        userid_a : message.sender.userid,
                        userid_b : message.to
                    },
                    roomkey : roomkey,
                    messages : []
                }

                chat.messages.push(message);

                let insertResult = createChat(chat);

                return insertResult;
            }
        } catch (error) {
            console.log('error storing messages...', error)
            return null;
        }
    },
    storeGroupMessage: async (message, roomkey) => {
        try {
            let chatExists = await checkChatExist(roomkey);

            if (chatExists) {
                console.log('mess que entra en grupo: ', message);
                let updateResult = await GroupChat.findOneAndUpdate({roomkey : roomkey},{ $push: { messages: message  } }, {new : true})
                return updateResult;
            } else {
             
                let  userids = [];

                message.readBy.forEach(element => {
                    userids.push(element.userid)
                });

                const participants = getParticipants(userids);
                const chatname = getChainName(message.to);

                let chat = {
                    name : chatname,
                    chainId : message.to,
                    groupParticipants : participants,
                    roomkey : roomkey, 
                    messages : []
                }

                chat.messages.push(message);

                let insertResult = createGroupChat(chat);

                return insertResult;
            }
        } catch (error) {
            console.log('error storing messages...', error)

            return null;
        }
    },
    markReadMessages : async (roomkey , userid) => {
        try {
            
            const [chat, groupChat] = await Promise.all([
                Chat.findOne({ roomkey: roomkey }).exec(),
                GroupChat.findOne({ roomkey: roomkey }).exec()
            ]);

            let  updatedResult = null;

            if(chat){

                 updatedResult = await Chat.updateMany(
                    {
                        roomkey: roomkey,
                        'messages.to': userid,
                        'messages.isRead': false
                    },
                    {
                        $set: { 'messages.$[elem].isRead': true }
                    },
                    {
                        arrayFilters: [{ 'elem.to': userid, 'elem.isRead': false }]
                    }
                );

                return updatedResult;

            }else if(groupChat){


                updatedResult = await GroupChat.updateMany(
                    {
                        roomkey: roomkey,
                        'messages.readBy': { $elemMatch: { userid: userid, isRead: false } }
                    },
                    {
                        $set: { 'messages.$[message].readBy.$[reader].isRead': true }
                    },
                    {
                        arrayFilters: [
                            { 'message.readBy.userid': userid, 'message.readBy.isRead': false },
                            { 'reader.userid': userid, 'reader.isRead': false }
                        ]
                    }
                );        

                return updatedResult;

            }

        } catch (error) {
            console.log('ERROR MARKING READ MESSAGES : ', error)
            return null;
        }
    }
}