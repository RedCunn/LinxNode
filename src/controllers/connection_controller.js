
const { v4: uuidv4 } = require('uuid');
let match = require('./utils/matching');
const matching = require('./utils/matching');
const Connection = require('../schemas/Connection');
const Account = require('../schemas/Account');
const Article = require('../schemas/Article');
const ChainReq = require('../schemas/ChainRequest');
const User = require('../schemas/User');

module.exports = {
    shuffleProfiles: async (req, res, next) => {
        try {
            const userid = req.params.userid;
            
            let _user = await User.findOne({ userid: userid })

            let matchingProfiles = await match.retrieveProfilesBasedOnCompatibility(_user);

            if(matchingProfiles.length > 0 ){
                let userIDs = new Set();
                let artIDs = new Set();
    
                matchingProfiles.forEach(p => {
                    userIDs.add(p.userid);
                    if (p.articles !== undefined && p.articles.length > 0) {
                        p.articles.forEach(artid => {
                            artIDs.add(artid)
                        })
                    }
                })
                let artIDsToArray = Array.from(artIDs);
                let accountArticles = await Article.find({ articleid: { $in: artIDsToArray } });
    
                let useridsToArray = Array.from(userIDs)
                let userProfiles = await User.find({userid : {$in : useridsToArray}})
    
                const accountsAndProfiles = {accounts : matchingProfiles, users : userProfiles}
    
                res.status(200).send({
                    code: 0,
                    error: null,
                    message: 'PERFILES COMPATIBLES ...',
                    token: null,
                    userdata: accountArticles,
                    others: accountsAndProfiles
                })
    
            }else{
                res.status(200).send({
                    code: 0,
                    error: null,
                    message: 'PERFILES COMPATIBLES ...',
                    token: null,
                    userdata: [],
                    others: {accounts : [], users : []}
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
    matchLinxs: async (req, res, next) => {
        try {
            const userid = req.params.userid;
            const linxuserid = req.params.linxuserid;

            let matchRank = 'HALF';

            let _areHalfMatches = await matching.areHalfMatches(userid, linxuserid);

            if (_areHalfMatches.length > 0) {
                const currentDate = new Date().toISOString();
                const _roomkey = uuidv4();
                let _doMatch = await matching.doMatch(userid, linxuserid, currentDate, _roomkey);
                console.log('RESULT DOING MATCH -> ', _doMatch);
                let _removeHalfMatch = await matching.removeFromHalfMatches(userid, linxuserid);
                console.log('RESULT REMOVING FROM HALFMATCH -> ', _removeHalfMatch);
                matchRank = 'FULL';
            } else {
                let _doHalfMatch = await matching.doHalfMatch(userid, linxuserid);
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
    getMatches: async (req, res, next) => {
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
                if (m.userid_a !== userid) {
                    matchUserIds.add(m.userid_a);
                }
                if (m.userid_b !== userid) {
                    matchUserIds.add(m.userid_b);
                }
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
