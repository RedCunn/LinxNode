const interactionRepo = require('../repositories/interactionRepo');
const accountRepo = require('../repositories/accountRepo');

module.exports = {
    getInteractions: async (req, res, next) => {
        try {

            const userid = req.query.to;

            const interactions = await interactionRepo.getInteractions(userid);

            let userIds = [];

            interactions.forEach(inter => {
                userIds.push(inter.from);
            })

            const accounts = await accountRepo.retrieveAccounts(userIds)

            res.status(200).send({
                code: 0,
                error: null,
                message: '',
                token: null,
                userdata: interactions,
                others: accounts
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: '',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    getChainInvites: async (req, res, next) => {
        try {
            const userid = req.query.from;

            const invites = await interactionRepo.getChainInvites(userid)

            res.status(200).send({
                code: 0,
                error: null,
                message: '',
                token: null,
                userdata: invites,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: '',
                token: null,
                userdata: null,
                others: null
            })
        }
    }
}