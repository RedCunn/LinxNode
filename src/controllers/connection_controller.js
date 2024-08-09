
const { v4: uuidv4 } = require('uuid');
const connectionRepo = require('../repositories/connectionRepo');
const Connection = require('../schemas/Connection');
const Account = require('../schemas/Account');
const Article = require('../schemas/Article');
const ChainReq = require('../schemas/ChainRequest');
const User = require('../schemas/User');
const articleRepo = require('../repositories/articleRepo');

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
                let _doMatch = await connectionRepo.doMatch(userid, linxuserid, currentDate, _roomkey);
                console.log('RESULT DOING MATCH -> ', _doMatch);
                let _removeHalfMatch = await connectionRepo.removeFromHalfMatches(userid, linxuserid);
                console.log('RESULT REMOVING FROM HALFMATCH -> ', _removeHalfMatch);
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

            let _matches = await Connection.find({
                $or: [
                    { userid_a: userid },
                    { userid_b: userid }
                ]
            })

            let matchUserIds = new Set();
            _matches.forEach(m => {
                
                matchUserIds.add(m.userid_a !== userid ? m.userid_a : m.userid_b);
                
            })

            let accounts = await Account.find({
                userid: { $in: Array.from(matchUserIds) }
            })

            let accountArticles = await Article.find({ userid: { $in: Array.from(matchUserIds) } });

            let accountsAndArticles = {accounts : accounts , articles : accountArticles}

            res.status(200).send({
                code: 0,
                error: null,
                message: 'MATCH ACCOUNTS WERE RETRIEVED : ',
                token: null,
                userdata: _matches,
                others: accountsAndArticles
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
