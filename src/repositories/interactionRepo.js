const { v4: uuidv4 } = require('uuid');
const Interaction = require('../schemas/Interaction');

module.exports = {
    createChainInviteInteraction : async(date, from , to, chain) => {
        try {

            const interaction = {id : uuidv4(),date , from , to , type : 'INVITE', object : {chain, state : 'PENDING'}};

            const insertResult = await Interaction.create(interaction);

            console.log('CHAIN INVITE INTERACTION CREATED : ', insertResult)
        } catch (error) {
            console.log('ERROR CREATING CHAIN INVITE INTERACTION !!!')
        }
    }
}