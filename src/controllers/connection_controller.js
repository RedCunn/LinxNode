
const { v4: uuidv4 } = require('uuid');
const connectionRepo = require('../repositories/connectionRepo');
const Connection = require('../schemas/Connection');
const Account = require('../schemas/Account');
const Article = require('../schemas/Article');
const ChainReq = require('../schemas/ChainRequest');
const User = require('../schemas/User');
const articleRepo = require('../repositories/articleRepo');
const accountRepo = require('../repositories/accountRepo');
const interactionRepo = require('../repositories/interactionRepo');

module.exports = {
    shuffleProfiles: async (req, res, next) => {
        try {
            const userid = req.params.userid;
            
            let _user = await User.findOne({ userid: userid })

            const candidateProfilesMap = await connectionRepo.findConnectionCandidates(_user);

            if(candidateProfilesMap.size > 0 ){

                let useridsArray = Array.from(candidateProfilesMap.keys());
                let accountArticles = await articleRepo.retrieveAccountsArticles(useridsArray);
                const arrayMap = Array.from(candidateProfilesMap.entries()).flat();
                const evenPositions = arrayMap.filter((_, index) => index % 2 !== 0);

                res.status(200).send({
                    code: 0,
                    error: null,
                    message: 'PERFILES COMPATIBLES ...',
                    token: null,
                    userdata: accountArticles,
                    others: evenPositions
                })
    
            }else{
                
                res.status(200).send({
                    code: 0,
                    error: null,
                    message: 'PERFILES COMPATIBLES ...',
                    token: null,
                    userdata: [],
                    others: []
                })
    
            }
            
        } catch (error) {
            console.log('ERROR SHUFFLING ...', error)
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'no hemos encontrado PERFILES COMPATIBLES ...',
                token: null,
                userdata: null,
                others: null
            })

        }
    },
    connectProfiles: async (req, res, next) => {
        try {
            const userid = req.params.userid;
            const linxuserid = req.params.linxuserid;

            let matchRank = 'HALF';

            let _areHalfMatches = await connectionRepo.areHalfMatches(userid, linxuserid);

            if (_areHalfMatches) {
                const currentDate = new Date().toISOString();
                const _roomkey = uuidv4();
                const _doMatch = await connectionRepo.doMatch(userid, linxuserid, currentDate, _roomkey);
                const _removeHalfMatch = await connectionRepo.removeFromHalfMatches(userid, linxuserid);
                await interactionRepo.createNewConnectionInteraction(currentDate, userid , linxuserid , _doMatch)
                await interactionRepo.createNewConnectionInteraction(currentDate, linxuserid , userid , _doMatch)

                matchRank = 'FULL';
            } else {
                let _doHalfMatch = await connectionRepo.doHalfMatch(userid, linxuserid);
                console.log('RESULT DOING HALF MATCH ->', _doHalfMatch)
            }

            res.status(200).send({
                code: 0,
                error: null,
                message: `${matchRank}`,
                token: null,
                userData: null,
                others: null
            })

        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'no hemos podido completar el match ...',
                token: null,
                userData: null,
                others: null
            })
        }
    },
    getConnections: async (req, res, next) => {
        try {

            const userid = req.params.userid;

            let connections = await connectionRepo.retrieveConnections(userid);

            let matchUserIds = new Set();
            connections.forEach(m => {
                
                matchUserIds.add(m.userid_a !== userid ? m.userid_a : m.userid_b);
                
            })
            let accounts = await accountRepo.retrieveAccounts(Array.from(matchUserIds));
            let accountArticles = await articleRepo.retrieveAccountsArticles(Array.from(matchUserIds));

            let connectmap = new Map();

            Array.from(matchUserIds).forEach(user => {
                connectmap.set(user, {connection : {}, account : {}, articles : []})
            })

            connections.forEach(conn => {
                connectmap.get(conn.userid_a !== userid ? conn.userid_a : conn.userid_b).connection = conn;
            })

            accounts.forEach(acc => {
                connectmap.get(acc.userid).account = acc;
            })

            accountArticles.forEach(art => {
                connectmap.get(art.userid).articles.push(art)
            })

            const arrayMap = Array.from(connectmap.entries()).flat();
            const evenPositions = arrayMap.filter((_, index) => index % 2 !== 0);
            
            res.status(200).send({
                code: 0,
                error: null,
                message: 'MATCH ACCOUNTS WERE RETRIEVED : ',
                token: null,
                userdata: evenPositions,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'ERROR RETRIEVING MATCH ACCOUNTS',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    unMatchUsers: async (req, res, next) => {
        try {
            const userid = req.params.userid;
            const matchuserid = req.params.matchuserid;

            let deleteMatch = await Connection.deleteOne({$or: 
                [
                    {$and : [{userid_a : userid , userid_b : matchuserid}]},
                    {$and : [{userid_a : matchuserid , userid_b : userid}]}
                ]
            })

            let chainReq = await ChainReq.findOne({$or: 
                [
                    {$and : [{requestedUserid : userid , requestingUserid : matchuserid}]},
                    {$and : [{requestedUserid : matchuserid , requestingUserid : userid}]}
                ]
            })

            if (chainReq) {
                await ChainReq.deleteOne({ _id: chainReq._id });
            }            

            console.log('DELETE MATCH RESULT : ', deleteMatch)

            res.status(200).send({
                code: 0,
                error: null,
                message: 'MATCH DELETED !!!',
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'ERROR DELETING MATCH .........',
                token: null,
                userdata: null,
                others: null
            })
        }
    }
}
