const chatRepo = require('../repositories/chatRepo');

module.exports = {

    getChat: async (req, res, next) => {
        try {

            const roomkey = req.params.roomkey;

            let chat = chatRepo.getChat(roomkey);

            res.status(200).send({
                code: 0,
                error: null,
                message: 'CHAT RETRIEVED',
                token: null,
                userdata: null,
                others: chat
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'COULDNT RETRIEVE CHAT',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    getChats: async (req, res, next) => {
        try {
            const userid = req.params.userid;

            let userchats = await chatRepo.getChats(userid);

            res.status(200).send({
                code: 0,
                error: null,
                message: 'RETRIEVED USER CHATS',
                token: null,
                userdata: null,
                others: userchats
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'ERROR RETRIEVING USER CHATS',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    storeMessage: async (req, res, next) => {
        try {
            const roomkey = req.params.roomkey;
            const { message } = req.body;
            let insertResult = await chatRepo.storeMessage(message, roomkey)
            
            if(insertResult === null){
                throw new Error;
            }

            res.status(200).send({
                code: 0,
                error: null,
                message: 'MESSAGE WAS STORED',
                token: null,
                userdata: null,
                others: insertResult
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'MESSAGE COULDNT BE STORED',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    storeGroupMessage: async (req, res, next) => {
        try {
            const roomkey = req.params.roomkey;
            const { message } = req.body;
            let insertResult = await chatRepo.storeGroupMessage(message, roomkey)

            if(insertResult === null){
                throw new Error;
            }

            res.status(200).send({
                code: 0,
                error: null,
                message: 'GROUPMESSAGE WAS STORED',
                token: null,
                userdata: null,
                others: insertResult
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'GROUPMESSAGE COULDNT BE STORED',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    markAsRead: async (req, res, next) => {
        try {
            let {userid, roomkey} = req.params

            let updateResult = await chatRepo.markReadMessages(roomkey , userid);

            if(updateResult === null){
                throw new Error;
            }

            res.status(200).send({
                code: 0,
                error: null,
                message: `MESSAGES UPDATED AS READ by ${userid}`,
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: `ERROR UPDATing messages AS READ `,
                token: null,
                userdata: null,
                others: null
            })
        }
    }
}