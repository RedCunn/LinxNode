const Account = require('../schemas/Account');
const ChainRequest = require('../schemas/ChainRequest');
const chainRepo = require('../repositories/chainRepo');
const Article = require('../schemas/Article');
const ChainIndex = require('../schemas/ChainIndex');

module.exports = {
    getMyLinxs: async (req, res, next) => {
        try {
            const _userid = req.params.userid;
            const _chainid = req.params.chainid;

            let _userAccount = await Account.findOne({ userid: _userid });

            let _myLinxPromises;
            if (_chainid === 'null') {
                _myLinxPromises = _userAccount.myLinxs.map(async (linx, i) => {
                    const account = await Account.findOne({ userid: linx.userid });
                    return account;
                })
            } else {
                _myLinxPromises = _userAccount.myLinxs.map(async (linx) => {
                    const chainIdPromises = linx.chainIds
                                            .filter(chainid => chainid === _chainid)
                                            .map(async () => {
                                                const account = await Account.findOne({ userid: linx.userid });
                                                return account;
                                            });
                    return Promise.all(chainIdPromises);
                });
            }

            const accounts = await Promise.all(_myLinxPromises);

            let artIDs = new Set();
            accounts.forEach(p => {
                if (p.articles !== undefined && p.articles.length > 0) {
                    p.articles.forEach(artid => {
                        artIDs.add(artid)
                    })
                }
            })
            let artIDsToArray = Array.from(artIDs);
            let accountArticles = await Article.find({ articleid: { $in: artIDsToArray } });

            res.status(200).send({
                code: 0,
                error: null,
                message: 'Cadena recuperada',
                token: null,
                userdata: accountArticles,
                others: accounts.flat()
            })
        } catch (error) {
            res.status(200).send({
                code: 1,
                error: error.message,
                message: 'Error al recuperar cadena...',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    requestChain: async (req, res, next) => {
        try {
            const userid = req.params.userid;
            const linxuserid = req.params.linxuserid;
            const chains = req.body.chains;

            const chainsMap = new Map(Object.entries(chains));
            let joinReqState = '';

            let requestStates = await chainRepo.isJoinChainRequested(userid, linxuserid, chainsMap);

            for (const [key, value] of requestStates) {
                if (value.state === 'ACCEPTED') {
                    await chainRepo.joinChains(userid, linxuserid, key);
                    joinReqState = 'ACCEPTING'
                }
                if (value.state === 'REQUESTED') {
                    await chainRepo.doChainRequest(userid, linxuserid, key, value.name);
                    joinReqState = 'REQUESTING'
                }
            }

            res.status(200).send({
                code: 0,
                error: null,
                message: joinReqState,
                token: null,
                userData: null,
                others: null
            })

        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'error haciendo cadena ...',
                token: null,
                userData: null,
                others: null
            })
        }
    },
    getJoinChainRequests: async (req, res, next) => {
        try {
            const userid = req.params.userid;
            let _chainReqsUserRequested = await ChainRequest.find({ requestedUserid: userid })
            let _chainReqsUserRequesting = await ChainRequest.find({ requestingUserid: userid })

            let _requestingIDs = [];
            _chainReqsUserRequested.forEach(r => {
                _requestingIDs.push(r.requestingUserid)
            })
            let _requestingAccounts = await Account.find({ userid: { $in: _requestingIDs } });

            let _requestedIDs = [];
            _chainReqsUserRequesting.forEach(r => {
                _requestedIDs.push(r.requestedUserid)
            })
            let _requestedAccounts = await Account.find({ userid: { $in: _requestedIDs } });

            let _requestingAccountsArticles = await Article.find({ userid: { $in: _requestingIDs } })

            let requestingAccounts = { accounts: _requestingAccounts, reqs: _chainReqsUserRequested, articles: _requestingAccountsArticles };
            let requestedAccounts = { accounts: _requestedAccounts, reqs: _chainReqsUserRequesting };

            res.status(200).send({
                code: 0,
                error: null,
                message: 'retrieved joinchain reqs...',
                token: null,
                userdata: requestedAccounts,
                others: requestingAccounts
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'error retrieving joinchain reqs...',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    breakChain: async (req, res, next) => {

        try {
            const userid = req.params.userid;
            const linxuserid = req.params.linxuserid;
            const chainid = req.params.chainid;

            await chainRepo.breakChain(userid, linxuserid, chainid);

            res.status(200).send({
                code: 0,
                error: null,
                message: 'BROKEN CHAIN',
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'The chain was too strong...couldnt break',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    rejectJoinChainRequest: async (req, res, next) => {
        try {

            const userid = req.params.userid;
            const linxuserid = req.params.linxuserid;

            let deleteReq = await ChainRequest.deleteOne({ requestedUserid: userid, requestingUserid: linxuserid });

            console.log('REJECTED JOIN CHAIN REQ !!!', deleteReq)

            res.status(200).send({
                code: 0,
                error: null,
                message: 'User rejected the join chain request.',
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'Couldnt complete rejection of join chain request.....',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    getChainLinxExtents: async (req, res, next) => {

        let userid = req.params.userid;
        let linxuserid = req.params.linxuserid

        linxuserid = linxuserid === 'null' ? null : linxuserid

        let linxExtents = chainRepo.retrieveChainLinxExtents(userid, linxuserid)

        let accountArticles = [];
        let extentsAccounts = [];
        let extents = []

        if (linxExtents.length > 0) {

            extents = linxExtents;

            let linxExtentsPromises = linxExtents.map(async (linx) => {
                const account = await Account.findOne({ userid: linx.userid });
                return account;
            })

            const accounts = await Promise.all(linxExtentsPromises);
            extentsAccounts = accounts;
            let artIDs = new Set();
            accounts.forEach(p => {
                if (p.articles !== undefined && p.articles.length > 0) {
                    p.articles.forEach(artid => {
                        artIDs.add(artid)
                    })
                }
            })
            let artIDsToArray = Array.from(artIDs);
            accountArticles = await Article.find({ articleid: { $in: artIDsToArray } });
        }

        let accountsArts = { accounts: extentsAccounts, articles: accountArticles }

        try {
            res.status(200).send({
                code: 0,
                error: null,
                message: 'EXTENTS RECUPERADOS',
                token: null,
                userdata: extents,
                others: accountsArts
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'ERROR RECUPERANDO EXTENTS ',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    getExtendedChains: async (req, res, next) => {
        try {

            const userid = req.params.userid;
            let chainid = req.params.chainid;

            chainid = chainid === 'null' ? null : chainid;

            let accountsGroupedByChain = {};
            let userAccount = await Account.findOne({ userid: userid })
            let extendedChainsIds = new Set();

            if (chainid === null) {

                userAccount.extendedChains.forEach(chain => {
                    extendedChainsIds.add(chain.chainid)
                })

                const chainsIdsArray = Array.from(extendedChainsIds);

                let chainIndexes = await ChainIndex.find({ chainID: { $in: chainsIdsArray } })

                for (let index of chainIndexes) {
                    let adminGroup = { chainID: index.chainID, chainName: index.chainName, accounts: [] }

                    for (let userid of index.userIDs) {
                        let account = await Account.findOne({ userid: userid })
                        chainGroup.accounts.push(account);
                    }

                    accountsGroupedByChain.push(adminGroup);
                }


            } else {
                let chainIndex = await ChainIndex.findOne({ chainID: chainid })
                let chainGroup = { chainID: chainIndex.chainID, chainName: chainIndex.chainName, accounts: [] }

                for (let userid of chainIndex.userIDs) {
                    let account = await Account.findOne({ userid: userid })
                    chainGroup.accounts.push(account);
                }

                accountsGroupedByChain.push(adminGroup);
            }
            res.status(200).send({
                code: 0,
                error: null,
                message: '',
                token: null,
                userdata: accountsGroupedByChain,
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
    getAllUserChains: async (req, res, next) => {
        try {

            const userid = req.params.userid;

            let userAccount = await Account.findOne({ userid: userid })

            let accountsGroupedByChainAdmin = [];
            let chainsIds = new Set();

            //1º  COJO TODAS LAS CHAINIDS que tenga el user (propias y extendidas)

            userAccount.myChains.forEach(chain => {
                chainsIds.add(chain.chainid)
            })
            userAccount.extendedChains.forEach(chain => {
                chainsIds.add(chain.chainid)
            });

            let chainIdsArray = Array.from(chainsIds);

            // 2º BUSCO LOS INDEX DE LAS CADENAS PARA RECUPERAR TODOS LOS USERIDS ASOCIADOS 

            let accountArticles = [];
            let useridsSet = new Set();

            let chainIndexes = await ChainIndex.find({ chainID: { $in: chainIdsArray } })

            for (let index of chainIndexes) {
                let adminGroup = { chainadminID: index.chainadminID, chainID : index.chainID, chainName: index.chainName, accounts: [] }
                for (let userid of index.userIDs) {
                    let account = await Account.findOne({ userid: userid })
                    adminGroup.accounts.push(account);
                    useridsSet.add(userid)
                }
                accountsGroupedByChainAdmin.push(adminGroup);
            }

            for (const id of useridsSet) {
                let articles = await Article.find({userid : id})
                accountArticles.push(articles);   
            }
            

            console.log('CUENTAS AGRUPADAS POR ADMIN DE CADENA : ', accountsGroupedByChainAdmin)

            res.status(200).send({
                code: 0,
                error: null,
                message: '',
                token: null,
                userdata: accountsGroupedByChainAdmin,
                others: accountArticles
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
    removeLinxLeavingExtents: async (req, res, next) => {

        const adminid = req.params.adminid;
        const chainid = req.params.chainid;
        const linxid = req.params.linxid;

        let result = chainRepo.removeLinxLeavingExtents(adminid , chainid, linxid)


        try {
            res.status(200).send({
                code: 0,
                error: null,
                message: `LINX AUTOREMOVED FROM CHAIN ${result}`,
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