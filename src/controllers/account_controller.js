const bcrypt = require('bcrypt');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const mailer = require('./utils/mailer')
const places = require('./utils/googleplaces');

const { default: mongoose } = require('mongoose');
const Account = require('../schemas/Account');
const User = require('../schemas/User');
const Chat = require('../schemas/Chat');
const GroupChat = require('../schemas/GroupChat');
const Article = require('../schemas/Article');
const chating = require('./utils/chating');
const Job = require('../schemas/Job');
const ChainIndex = require('../schemas/ChainIndex');

function generateToken(userdata) {

    const payload = {
        userid: userdata.userid,
        email: userdata.email,
        exp: moment().add(2, 'hours').unix()
    }
    const token = jwt.sign(payload, process.env.JWT_SECRETKEY)
    return token;
}

module.exports = {

    trackLocationGeocode: async (req, res, next) => {
        try {

            let { lat, long } = req.query;

            const userlocation = await places.geocode(lat, long);

            res.status(200).send({
                code: 0,
                error: null,
                message: 'Trackeada localizacion actual del user por GoogleMaps Geocode',
                token: null,
                userData: null,
                others: userlocation
            })

        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'error al trackear localizacion actual por GoogleMaps Geocode',
                token: null,
                userData: null,
                others: null
            })
        }
    },
    getPlaceDetails: async (req, res, next) => {
        try {
            const city_id = req.params.cityid;
            const addrComponents = await places.placeDetails(city_id);

            res.status(200).send({
                code: 0,
                error: null,
                message: 'Trackeada localizacion user por Google Places',
                token: null,
                userData: null,
                others: addrComponents
            })
        } catch (error) {

            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'error al trackear localizacion por Google Places',
                token: null,
                userData: null,
                others: null
            })
        }
    },
    signup: async (req, res, next) => {

        let { account, geolocation } = req.body;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const _user_id = uuidv4();

            const actToken = generateToken({ userid: _user_id, email: account.email });
            let now = moment();
            let expires = now.add(2, 'hours');

            let _account = {
                userid: _user_id,
                createdAt: account.createdAt,
                linxname: account.linxname,
                email: account.email,
                password: bcrypt.hashSync(account.password, 10),
                active: false,
                activeToken: actToken,
                activeExpires: expires,
                myChain: [],
                exchanger: [],
                agenda: []
            }

            let _accountInsertResult = await Account.create([_account], session);

            const _findAccountID = Account.findOne({ userid: _user_id });

            let _user = {
                userid: _user_id,
                accountid: _findAccountID.id,
                name: req.body.name,
                lastname: req.body.lastname,
                preferences: {
                    ageRange: {
                        fromAge: parseInt(req.body.preferences.ageRange.fromAge),
                        toAge: parseInt(req.body.preferences.ageRange.toAge)
                    },
                    genders: req.body.preferences.genders,
                    proxyRange: req.body.preferences.proxyRange,
                    sharePolitics: req.body.preferences.sharePolitics,
                    shareDiet: req.body.preferences.shareDiet,
                    languages: req.body.preferences.languages,
                    shareIndustry: req.body.preferences.shareIndustry
                },
                birthday: req.body.birthday,
                gender: req.body.gender,
                geolocation: {
                    country_id: geolocation.country_id,
                    city_id: geolocation.city_id,
                    area1_id: geolocation.area1_id,
                    area2_id: geolocation.area2_id,
                    global_code: geolocation.global_code
                },
                politics: req.body.politics,
                diet: req.body.diet,
                languages: req.body.languages,
                work: {
                    industry: req.body.work.industry,
                    other: req.body.work.other
                }
            }
            let _userInsertResult = await User.create([_user], session);

            await session.commitTransaction();
            session.endSession();
            console.log("Todas las inserciones fueron exitosas.");

            mailer.sendAccountActivationEmail(_account.email, actToken);

            res.status(200).send({
                code: 0,
                error: null,
                message: 'REGISTRO COMPLETADO',
                token: null,
                userData: null,
                others: null
            })
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Error durante la inserción:", error);
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'ERROR EN REGISTRO',
                token: null,
                userData: null,
                others: null
            })
        }
    },
    activateAccount: async (req, res, next) => {
        try {
            const token = req.query.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRETKEY)

            if (moment().unix() > decoded.exp) {
                throw Error('Expired TOken')
            }
            await Account.updateOne({ userid: decoded.userid }, { active: true });
            res.redirect('http://localhost:4200/Linx/activa')
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'ERROR AL ACTIVAR CUENTA USER',
                token: null,
                userData: null,
                others: null
            })
        }
    },
    signin: async (req, res, next) => {
        let { emailorlinxname, password } = req.body;
        try {

            let _account = await Account.findOne({ $or: [{ email: emailorlinxname }, { linxname: emailorlinxname }] })

            if (!_account) throw new Error('no existe cuenta con ese email o linxname...................');

            if (bcrypt.compareSync(password, _account.password)) {

                if (!_account.active) throw new Error('ESTA CUENTA NO ESTA ACTIVADA...................');

                let _userProfQuery = await User.findOne({ userid: _account.userid });
                let _userProf = _userProfQuery.toObject();
                let userData = { ..._userProf, accountid: _account._id, account: _account };
                let accountArticles = await Article.find({ userid: _account.userid })

                let _jwt = jwt.sign(
                    {
                        userid: _account.userid,
                        username: _account.username,
                        email: _account.email
                    },
                    process.env.JWT_SECRETKEY,
                    {
                        expiresIn: '1h',
                        issuer: 'http://localhost:3000'
                    }
                )

                res.status(200).send({
                    code: 0,
                    error: null,
                    message: `${_account.linxname} ha iniciado sesión`,
                    token: _jwt,
                    userdata: userData,
                    others: accountArticles
                })
            }

        } catch (error) {
            console.log("ERROR EN EL LOGIN .....", error)

            res.status(200).send({
                code: 1,
                error: error.message,
                message: `ERROR AL INICIAR SESION con ${emailorlinxname}`,
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    authenticate: async (req, res, next) => {
        try {
            const userid = req.params
            const { password } = req.body;

            let _account = await Account.findOne({ userid: userid })
            if (bcrypt.compareSync(password, _account.password)) {
                res.status(200).send({
                    code: 0,
                    error: null,
                    message: 'AUTHENTICATED ',
                    token: null,
                    userdata: null,
                    others: null
                })
            } else {
                res.status(200).send({
                    code: 1,
                    error: null,
                    message: 'WRONG CREDENTIALS',
                    token: null,
                    userdata: null,
                    others: null
                })
            }
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'Authentication failed...',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    resetPassword: async (req, res, next) => {
        try {
            const userid = req.params
            const { password } = req.body;
            let _account = await Account.updateOne({ userid: userid }, { password: bcrypt.hashSync(password, 10) });

            console.log('UPDATE ACCOUNT result changing PWD : ', _account)

            res.status(200).send({
                code: 0,
                error: null,
                message: 'PWD CHANGED SUCCESSFULLY ',
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'Error changing pwd...',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    modifyAccountData: async (req, res, next) => {
        try {

        } catch (error) {

        }
    },
    deleteAccount: async (req, res, next) => {
        try {
            const userid = req.params
            const currentDate = new Date();
            let account = await Account.findOne({ userid: userid })
            account.active = false;
            account.save();

            let insertJob = await Job.create({
                refid: userid,
                task: "delete_account",
                status: "pending",
                createdAt: currentDate.toISOString(),
                payload: {
                    refid: userid,
                    subject: "Cuenta LINX",
                    address: account.email,
                    message: `${account.linxname} tu cuenta y todos tus datos han sido eliminados definitivamente de las bases de datos de LINX. Gracias por los momentos compartidos...lo hemos pasado bien juntxs.`
                }
            })

            console.log('JOB INSERT RESULT : ', insertJob)

            res.status(200).send({
                code: 0,
                error: null,
                message: 'ACCOUNT DELETED ... the change will be irreversible in 10 days.',
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'Error deleting account...',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    getChats: async (req, res, next) => {
        try {
            const { userid: _userid, linxuserid: _linxuserid } = req.params;

            let chats = [];
            let groupchats = [];

            if (_linxuserid === 'null') {
                chats = await Chat.find({
                    $or: [
                        { 'participants.userid_a': _userid },
                        { 'participants.userid_b': _userid }
                    ]
                });
                
                groupchats = await GroupChat.find({'groupParticipants.userid': _userid})

                if(groupchats.length > 0){
                    for (let group of groupchats) {
                        const chain = await ChainIndex.findOne({chainID : group.roomkey})   
                        if(chain){
                            group.conversationname = chain.chainName
                        }
                    }
                }
                
            } else {
                chats = await Chat.find({
                    $or: [
                        { $and: [{ 'participants.userid_a': _userid }, { 'participants.userid_b': _linxuserid }] },
                        { $and: [{ 'participants.userid_a': _linxuserid }, { 'participants.userid_b': _userid }] }
                    ]
                });
            }

            let convernamesUserids = new Set();

            chats.forEach(chat => {
                if (chat.participants.userid_a !== _userid) {
                    convernamesUserids.add(chat.participants.userid_a)
                }

                if (chat.participants.userid_b !== _userid) {
                    convernamesUserids.add(chat.participants.userid_b)
                }

            })
            let convernamesUseridsToArray = Array.from(convernamesUserids);
            let accounts = await Account.find({ userid: { $in: convernamesUseridsToArray } })

            let mapnamesids = new Map();
            accounts.forEach(({ userid, linxname }) => {
                mapnamesids.set(userid, linxname);
            });

            chats.forEach(chat => {
                const { participants } = chat;
                if (mapnamesids.has(participants.userid_a)) {
                    chat.conversationname = mapnamesids.get(participants.userid_a);
                }
                if (mapnamesids.has(participants.userid_b)) {
                    chat.conversationname = mapnamesids.get(participants.userid_b);
                }
            });



            res.status(200).send({
                code: 0,
                error: null,
                message: 'CHATS RECUPERADOS',
                token: null,
                userdata: groupchats,
                others: chats
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'ERROR AL RECUPERAR CHAT',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    storeChatMessage: async (req, res, next) => {
        try {
            const roomkey = req.params.roomkey;
            const { message, participants } = req.body;
            let insertResult = await chating.storeMessage(message, roomkey, participants.userid_a, participants.userid_b)

            res.status(200).send({
                code: 0,
                error: null,
                message: 'MESSAGE WAS STORED',
                token: null,
                userdata: null,
                others: insertResult
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'MESSAGE COULDNT BE STORE',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    storeGroupChatMessage: async (req, res, next) => {
        try {
            const roomkey = req.params.roomkey;
            const { message, groupParticipants } = req.body;

            let findResult = await GroupChat.findOne({roomkey : roomkey});

            if(findResult){
                findResult.messages.push(message);
                await findResult.save();
            }else{
                let insertResult = await GroupChat.create({groupParticipants : groupParticipants , roomkey : roomkey , messages : [message]})
                console.log('INSERT RESULT ON STORE GROUP CHAT MESSAGE : ', insertResult)
            }


            res.status(200).send({
                code: 0,
                error: null,
                message: 'MENSAJE GUARDADO EN CHAT DE GRUPO',
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'NO HEMOS PODIDO GUARDAR EL MENSAJE EN CHAT DE GRUPO',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    markMessagesAsRead: async (req, res, next) => {
        try {

            let messages = req.body
            let userid = req.params.userid


            const updateOperations = messages.map((m) => ({
                updateOne: {
                    filter: { 'messages': { $elemMatch: { _id: m._id } } },
                    update: { $set: { 'messages.$.isRead': true } }
                }
            }));

            let bulkresult = await Chat.bulkWrite(updateOperations);

            console.log('BULKRESULT MARKING MESS : ', bulkresult)


            res.status(200).send({
                code: 0,
                error: null,
                message: `MESSAGES UPDATED AS READ by ${userid}`,
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: `ERROR UPDATing AS READ `,
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    newArticle: async (req, res, next) => {
        try {
            const _userid = req.params.userid;
            const { title, body, postedOn, useAsProfilePic, articleid } = req.body;
            let insertArticle;
            let filePath = '';
            if (req.file) {
                filePath = _userid + '/' + req.file.originalname;
                insertArticle = await Article.create({ userid: _userid, articleid, postedOn, useAsProfilePic, title, body, img: filePath })
            } else {
                insertArticle = await Article.create({ userid: _userid, articleid, postedOn, useAsProfilePic, title, body })
            }
            let insertArticleRef = await Account.updateOne({ userid: _userid }, { $push: { articles: insertArticle.articleid } })

            res.status(200).send({
                code: 0,
                error: null,
                message: 'saved new article!!!',
                token: null,
                userdata: null,
                others: filePath
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'couldnt save new article...',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    editArticle: async (req, res, next) => {
        try {

            const _userid = req.params.userid;
            const _artid = req.params.artid;
            const { title, body, postedOn, useAsProfilePic } = req.body;

            let updateArticle;
            let filePath = '';
            if (req.file) {
                filePath = _userid + '/' + req.file.originalname;
                updateArticle = await Article.updateOne({ userid: _userid, articleid: _artid }, { title, body, postedOn, useAsProfilePic, img: filePath })
            } else {
                updateArticle = await Article.updateOne({ userid: _userid, articleid: _artid }, { title, body, postedOn, useAsProfilePic })
            }

            if (useAsProfilePic === 'true') {
                updateArticleUseAsProfPic = await Article.updateMany({ $and: [{ userid: _userid, articleid: { $ne: _artid } }] }, { useAsProfilePic: false })
            }

            res.status(200).send({
                code: 0,
                error: null,
                message: 'saved article changes!!!',
                token: null,
                userdata: null,
                others: filePath
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'couldnt save article changes...',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    deleteArticle: async (req, res, next) => {
        try {
            const _userid = req.params.userid;
            const _artid = req.params.artid;
            await Article.deleteOne({ userid: _userid, articleid: _artid });
            res.status(200).send({
                code: 0,
                error: null,
                message: 'article deleted !!!',
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            console.log('ERROR ON DELETE : ', error)
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'couldnt delete article ...',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    deleteArticleImage: async (req, res, next) => {
        const _userid = req.params.userid;
        const _artid = req.params.artid;
        let update = await Article.updateOne({ userid: _userid, articleid: _artid }, { img: '' });

        try {
            res.status(200).send({
                code: 0,
                error: null,
                message: 'Deleted Article IMG',
                token: null,
                userdata: null,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'Error deleting Article IMG',
                token: null,
                userdata: null,
                others: null
            })
        }
    },
    getAccountArticles: async (req, res, next) => {
        try {
            const userid = req.params.userid;

            let articles = await Article.find({ userid: userid })

            res.status(200).send({
                code: 0,
                error: null,
                message: 'ARTICULOS RECUPERADO',
                token: null,
                userdata: articles,
                others: null
            })
        } catch (error) {
            res.status(400).send({
                code: 1,
                error: error.message,
                message: 'ERROR RECUPERANDO ARTICULOS DE CUENTA',
                token: null,
                userdata: null,
                others: null
            })
        }
    }

}
