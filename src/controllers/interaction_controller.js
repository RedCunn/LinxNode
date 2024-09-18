module.exports = {
    getInteractions: async (req, res, next) => {
        try {
            res.status(200).send({
                code: 0,
                error: null,
                message: '',
                token: null,
                userdata: null,
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
    },
    getChainInvites: async (req, res, next) => {
        try {
            res.status(200).send({
                code: 0,
                error: null,
                message: '',
                token: null,
                userdata: null,
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