const { v4: uuidv4 } = require('uuid');
const Interaction = require('../schemas/Interaction');

module.exports = {
    getInteractions : async (userid) => {
        try {
            const interactions = await Interaction.find({to : userid , checked : false})
            return interactions;
        } catch (error) {
            console.log('ERROR RETRIEVING INTERACTIONS TO USER : ', error)
            return [];
        }
    },
    getChainInvites : async(userid) => {
        try {
            const invites = await Interaction.find({type : 'INVITE', from : userid});
            return invites;
        } catch (error) {
            console.log('ERROR RETRIEVING CHAIN INVITES FROM USER : ', error)
            return [];
        }
    },
    createChainInviteInteraction : async(date, from , to, chain) => {
        try {
            const interaction = {id : uuidv4(),date , from , to , type : 'INVITE', object : {chain, state : 'PENDING'}};
            const insertResult = await Interaction.create(interaction);
        } catch (error) {
            console.log('ERROR CREATING CHAIN INVITE INTERACTION !!!')
        }
    },
    createNewConnectionInteraction : async (date, from , to , connection) => {
        try {
            const interaction = {id : uuidv4(),date , from , to , type : 'CONNECTION', object : connection};
            const insertResult = await Interaction.create(interaction);
            console.log('NEW CONNECTION INTERACTION CREATED : ', insertResult)
        } catch (error) {
            console.log('ERROR CREATING NEW CONNECTION INTERACTION !!!')
        }
    }
}