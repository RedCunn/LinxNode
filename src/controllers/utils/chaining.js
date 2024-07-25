const { v4: uuidv4 } = require('uuid');
const ChainReq = require('../../schemas/ChainRequest');
const Account = require('../../schemas/Account');
const Match = require('../../schemas/Match');
const LinxExtent = require('../../schemas/LinxExtent');
const ChainIndex = require('../../schemas/ChainIndex');
const ChainRequest = require('../../schemas/ChainRequest');

module.exports = {
    isJoinChainRequested: async (userid, linxid, chains) => {
        try {
            let reqStates = new Map();
            let _chainid = ''; 
            console.log('CHAINS IS JOIN CHAIN REQ ???? ', chains)
            for (const [key , value] of chains) {

                if(key === 'new'){
                    _chainid = uuidv4();
                    reqStates.set(_chainid , {name : value, state : 'REQUESTED'})
                }else{
                    let isRequested = await ChainReq.find({
                        $or: [
                            { $and: [{ requestingUserid: userid }, { requestedUserid: linxid }, { 'chain.chainid': key}] },
                            { $and: [{ requestingUserid: linxid }, { requestedUserid: userid }, {'chain.chainid': key }] }
                        ]
                    });

                    if(isRequested.length > 0){
                        reqStates.set(key , {name : value, state : 'ACCEPTED'})
                    }else{
                        reqStates.set(key , {name : value, state : 'REQUESTED'})
                    }
                }
                
            }
            console.log('REQUEST STATES : ', reqStates)
            return reqStates;
        } catch (error) {
            console.log('error selecting isRequested...', error)
        }
    },
    doChainRequest: async (userid, linxid, chainid , chainname) => {
        try {
            let insertResult = await ChainReq.create({ requestingUserid: userid, requestedUserid: linxid , chain : {chainid : chainid , chainname : chainname}})
            console.log('result of insertion on ChainRequests: ', insertResult)
            return insertResult;
        } catch (error) {
            console.log('result ERROR of insertion on ChainRequests: ', error)
        }
    },
    retrieveChainLinxExtents : async (userid , linxid) => {
        try {
            let extents = [];
            if(linxid !== null){
                extents = await LinxExtent.find({mylinxuserID : linxid , chainadminID : userid})
            }else{
                extents = await LinxExtent.find({chainadminID : userid})
            }
            return extents;
        } catch (error) {
            console.log('ERROR RECUPERANDO EXTENTS : ', error)
        }
    },
    joinChains: async (userid, linxid, chainid) => {
        const session = await Account.startSession();
        session.startTransaction();
        try {

            let linxAccount = await Account.findOne({ userid: linxid })
            let userAccount = await Account.findOne({ userid: userid })

            if (!linxAccount || !userAccount) {
                throw new Error('Account not found');
            }

            // vemos si está creada ya la cadena o es nueva 
            const chainIndex = await ChainIndex.findOne({chainID : chainid});

            let insertChain;
            let CHAIN_ID;
            let CHAIN_NAME; 

            if(chainIndex !== null){
                if(chainIndex.chainadminID === userid){
                    insertIndex = await ChainIndex.findOneAndUpdate({chainID : chainid, chainadminID : userid},   { $push: { userIDs: linxid } }).session(session)
                    CHAIN_ID = insertIndex.chainID
                    CHAIN_NAME = insertIndex.chainName
                }else{
                    insertIndex = await ChainIndex.findOneAndUpdate({chainID : chainid, chainadminID : linxid},   { $push: { userIDs: userid } }).session(session)
                    CHAIN_ID = insertIndex.chainID
                    CHAIN_NAME = insertIndex.chainName
                }
            }else{
                // BORRAMOS LA PETICION y RECUPERAMOS DE ELLA EL CHAINID
                joinRequest = await ChainRequest.findOneAndDelete({'chain.chainid' : chainid}).session(session)
                CHAIN_ID = joinRequest.chain.chainid
                CHAIN_NAME = joinRequest.chain.chainname

                insertChain = await Account.findOneAndUpdate(
                    { userid: joinRequest.requestingUserid },
                    { $push: { myChains: { chainid: joinRequest.chain.chainid, chainname: joinRequest.chain.chainname } } },
                    { new: true, upsert: true }
                  ).session(session);

                  const insertIndex = await ChainIndex.create([{
                    chainadminID: joinRequest.requestingUserid,
                    chainID: joinRequest.chain.chainid,
                    chainName: joinRequest.chain.chainname,
                    userIDs: [userid, linxid]
                }], { session });
            }

            console.log('INSERT CHAIN RESULT chaining-joinChains : ', insertChain)

            // vamos a tener que coger la llave del chat de su Match si son Match, y sino crear una 

            let roomkey = '';            

            // COMPROBAMOS SI ERAN MATCHES
            let match = await Match.findOne({
                $or: [
                    { $and: [{ userid_a: userid }, { userid_b: linxid }] },
                    { $and: [{ userid_a: linxid }, { userid_b: userid }] }
                ]
            })

            if(match){
                roomkey = match.roomkey;
            }else{
                roomkey = uuidv4();
            }

            // INCLUIMOS LA CHAIN DEL USER EN LA EXTENDEDCHAIN DEL LINX
        
            linxAccount.extendedChains.push({chainadminid : userid , chainid : CHAIN_ID , chainname : CHAIN_NAME })
            
            // INCLUIMOS AL LINX EN LXS LINXS DEL USER y AL USER EN LXS LINXS DEL LINX

            const userMyLinxsIndex = userAccount.myLinxs.findIndex(linx => linx.userid === linxid);

            if(userMyLinxsIndex !== -1 ){
                userAccount.myLinxs[userMyLinxsIndex].chainIds.push(CHAIN_ID);
            }else{
                userAccount.myLinxs.push({chainIds : [ CHAIN_ID] , userid : linxAccount.userid , roomkey : roomkey})
            }

            const linxMyLinxsIndex = userAccount.myLinxs.findIndex(linx => linx.userid === userid);

            if(linxMyLinxsIndex !== -1 ){
                linxAccount.myLinxs[linxMyLinxsIndex].chainIds.push(CHAIN_ID);
            }else{
                linxAccount.myLinxs.push({chainIds : [ CHAIN_ID] , userid : userAccount.userid , roomkey : roomkey})
            }


            // SI FUERAN MATCHES BORRAMOS EL MATCH 
            if(match){
                let removeMatch = await Match.deleteOne({
                    $or: [
                        { $and: [{ userid_a: userid }, { userid_b: linxid }] },
                        { $and: [{ userid_a: linxid }, { userid_b: userid }] }
                    ]
                }).session(session)
            }

            await userAccount.save({ session: session });
            await linxAccount.save({ session: session });

            await session.commitTransaction();

            console.log('LINXS JOINED TO CHAIN SUCCESFULLY')
        } catch (error) {
            await session.abortTransaction();
            console.error('Error durante la transacción JOINING CHAINS:', error);
        }finally{
            session.endSession();
        }
    },
    addExtentToChain : async(chainAdminId, chainid , chainName , linxid , extentuserid) => {
        const session = await Account.startSession();
        session.startTransaction();
        try {
            
            let insertLinxExtent = await LinxExtent
                                        .create({chainadminID : chainAdminId , chainID : chainid , mylinxuserID : linxid , userid : extentuserid})
                                        .session(session)
            
            let extentAccount = await Account
                                    .findOneAndUpdate({userid : extentuserid},
                                                    {extendedChains : {$push: { extendedChains : {chainadminid :  chainAdminId , chainid : chainid , chainname : chainName }}}})
                                                    .session(session)

            let updateIndex = await ChainIndex
                                    .findOneAndUpdate({chainID : chainid},{$push:{userIDs : extentuserid}})

        
            await session.commitTransaction();

            console.log('EXTENT ADDED TO CHAIN SUCCESSFULLY ')
        } catch (error) {
            await session.abortTransaction();
            console.error('Error durante la transacción ADDEXTENT TO CHAIN :', error);
        }finally{
            session.endSession();
        }
    },
    removeLinxLeavingExtents : async (chainAdminId, chainId , linxid) => {
        const session = await Account.startSession();
        session.startTransaction();
        try {

            // 1º ELIMINAMOS DE MYLINXS cuando linxeadxs por esa CHAINID
            let userMyLinxs = await Account.findOneAndUpdate(
                { userid: chainAdminId }, 
                { 
                    $pull: { 
                        myLinxs: { 
                            userid: linxid,
                            chainid : chainid
                        } 
                    } 
                },
                { new: true } 
            ).session(session);
            
            console.log('DELETing FROM MYLINXS : ', userMyLinxs)

            // 2º ELIMINAMOS DE MYLINXS y DE EXTENDED CHAIN por esa CHAINID en EXLINX
            
            let linxMyLinxs = await Account.findOneAndUpdate(
                { userid: linxid }, 
                { 
                    $pull: { 
                        myLinxs: { 
                            userid: chainAdminId,
                            chainid: chainid
                        },
                        extendedChains: {
                            chainid: chainid
                        } 
                    }
                },
                { new: true }
            ).session(session);
            

            console.log('UPDATING LNX ACCOUNT : ', linxMyLinxs)

            // 3º ACTUALIZAMOS INDEX 

            let deleteFromIndex = await ChainIndex.findOneAndDelete({chainID : chainId , chainadminID : chainAdminId},
                {$pull : {userIDs : linxid}}
            )

            console.log('DELETING linx from index...', deleteFromIndex)


            await session.commitTransaction();
            console.log('LINX autoREMOVED from CHAIN WITH SUCCESS')
            
            return deleteFromIndex.chainName;
        } catch (error) {
            await session.abortTransaction();
            console.error('Error durante la transacción AUTOREMOVING LINX FROM CHAIN:', error);
        }finally{
            session.endSession();
        }
    },
    breakChain : async (userid , linxuserid, chainid)=> {
        const session = await Account.startSession();
        session.startTransaction();
        try {

            // --> comprobamos de quién era la cadena : 

            let chainIndex = await ChainIndex.findOne({chainID : chainid});

            const CHAIN_ADMIN_ID = chainIndex.chainadminID;

            const exLINX_ID = userid === CHAIN_ADMIN_ID ? linxuserid : CHAIN_ADMIN_ID;
            
            // 1º ELIMINAMOS DE MYLINXS cuando linxeadxs por esa CHAINID
            let userMyLinxs = await Account.findOneAndUpdate(
                { userid: CHAIN_ADMIN_ID, 'myLinxs.userid': exLINX_ID },
                { $pull: { 'myLinxs.$.chainIds': chainid } },
                { new: true, session: session });
            
            console.log('DELETing FROM MYLINXS : ', userMyLinxs)
            
            let linxMyLinxs = await Account.findOneAndUpdate(
                { userid: exLINX_ID, 'myLinxs.userid': CHAIN_ADMIN_ID },
                { $pull: { 'myLinxs.$.chainIds': chainid } },
                { new: true, session: session });
            

            console.log('DELETing FROM LINX MYLINXS : ', linxMyLinxs)

            // 2º ELIMINAMOS DE EXTENDEDCHAINS DEL EXLINX

            let linxExtends = await Account.findOneAndUpdate(
                { userid: exLINX_ID }, 
                { 
                    $pull: { 
                        extendedChains: { 
                            chainadminid : CHAIN_ADMIN_ID,
                            chainid : chainid
                        } 
                    } 
                },
                { new: true } 
            ).session(session);

            console.log('DELETing Linx Extended CHain : ', linxExtends)

            // 3º ELIMINAMOS LOS LINXEXTENTS QUE EL EXLINX HUBIESE AÑADIDO A LA CADENA
            let extentsIds = new Set();
            let extents =  await LinxExtent.find({chainID : chainid , mylinxuserID : exLINX_ID, chainadminID : CHAIN_ADMIN_ID});
            
            extents.forEach(ext => {
                extentsIds.add(ext.userid)
            })

            let deleteExtents = await LinxExtent.deleteMany({chainID : chainid , mylinxuserID : exLINX_ID}).session(session);

            console.log('DELETE EXTENTS : ', deleteExtents)

            // 4º ELIMINAMOS CADENA DE LAS EXTENDEDCHAINS DE LOS LINXEXTENTS
            
            let extentsIdsArray = Array.from(extentsIds);

            for (const id of extentsIdsArray) {
                let deleteExtended = await Account.findOneAndUpdate({userid : id}, 
                    { 
                                $pull: { 
                                    extendedChains: { 
                                        chainid : chainid
                                    } 
                                } 
                            }).session(session);

                            console.log('DELETing extended chains from EXTENTS : ', deleteExtended)
            }
            
            // 5º ACTUALIZAMOS EL INDEX 
            extentsIdsArray.push(exLINX_ID)

            let updateIndex = await ChainIndex.findOneAndUpdate({chainID : chainid},
                            {$pull : {userIDs : {$in : extentsIdsArray}}}).session(session);

            console.log('UPDATED INDEX : ', updateIndex)

            await session.commitTransaction();

            console.log('A BROKEN CHAIN IS NEVER HAPPY BUT DONE WITH SUCCESS')

        } catch (error) {
            await session.abortTransaction();
            console.error('Error durante la transacción BREAKING CHAINS:', error);
        }finally{
            session.endSession();
        }
    }
    
}
