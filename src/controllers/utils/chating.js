const Chat = require('../../schemas/Chat');

module.exports = {
    storeMessage: async (message, roomkey, userid_a, userid_b) => {
        try {
            let chatExists = await Chat.find({roomkey : roomkey})
            if (chatExists.length > 0) {
                console.log('mess que entra : ', message);
                let updateResult = await Chat.findOneAndUpdate({roomkey : roomkey},{ $push: { messages: message  } }, {new : true})
                return updateResult;
            } else {
                let insertResult = await Chat.create({
                    participants: { userid_a: userid_a, userid_b: userid_b },roomkey : roomkey,messages: [message]});
                return insertResult;
            }
        } catch (error) {
            console.log('error storing messages...', error)
        }
    }
}