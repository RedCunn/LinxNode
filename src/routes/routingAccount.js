const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/account_controller');

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userid = req.params.userid;
        const userDirectory = path.join('C:/Users/cunns/Documents/TFGLinx/articles', userid);

        fs.access(userDirectory, (err) => {
            if (err) {
                fs.mkdir(userDirectory, { recursive: true }, (err) => {
                    if (err) {
                        console.error('Error al crear el directorio:', err);
                        cb(err);
                    } else {
                        cb(null, userDirectory);
                    }
                });
            } else {
                cb(null, userDirectory);
            }
        })
    },
    filename: function (req, file, cb) {
        const artid = req.body.articleid;
        const userDirectory = path.join('C:/Users/cunns/Documents/TFGLinx/articles', req.params.userid);
            fs.readdir(userDirectory, (err, files) => {
                if (err) {
                    console.error('Error al leer el directorio:', err);
                    return cb(err);
                }
    
                let fileToDelete = null;
                for (const filename of files) {
                    const [existingArtid] = filename.split('__');
                    if (existingArtid === artid) {
                        fileToDelete = filename;
                        break;
                    }
                }
    
                if (fileToDelete) {
                    const filePath = path.join(userDirectory, fileToDelete);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error al eliminar el archivo existente:', err);
                            return cb(err);
                        } else {
                            cb(null, file.originalname);
                        }
                    });
                } else {
                    cb(null, file.originalname);
                }
            });
        
    }

})

const upload = multer({
    storage: storage
})

const deleteFile = (req, res, next) => {
    const { userid } = req.params;
    const filename = req.query.img;
    const userDirectory = path.join('C:/Users/cunns/Documents/TFGLinx/articles', userid);

    if(filename){
        fs.readdir(userDirectory, (err, files) => {
            if (err) {
                console.error('Error al leer el directorio:', err);
                return res.status(500).json({ message: 'Error al leer el directorio' });
            }
    
            let fileToDelete = null;
            for (const name of files) {
                if (name === filename) {
                    fileToDelete = filename;
                    break;
                }
            }
    
            if (fileToDelete) {
                const filePath = path.join(userDirectory, fileToDelete);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error al eliminar el archivo:', err);
                        return res.status(500).json({ message: 'Error al eliminar el archivo' });
                    } else {
                        console.log('Archivo eliminado.');
                        next();
                    }
                });
            } else {
                return res.status(404).json({ message: 'Archivo no encontrado' });
            }
        });
    }else{
        next();
    }
    
};

const jwt = require('jsonwebtoken');

async function checkJWT(req, res, next) {
    try {
        //extraigo de la peticion, la cabecera "Authorization: Bearer ....jwt..."
        let _jwt = req.headers.authorization.split(' ')[1];
        const _payload = await jwt.verify(_jwt, process.env.JWT_SECRETKEY);
        req.payload = _payload;
        next();

    } catch (error) {
        res.status(401)
            .send(
                {
                    code: 1,
                    message: 'error al comprobar JWT enviado',
                    error: error.message,
                    token: null,
                    userdata: null,
                    others: null
                }
            );
    }
}

router.use('/uploads', express.static(path.join('C:/Users/cunns/Documents/TFGLinx/articles/')))

router.get('/trackLocationGeocode', AccountController.trackLocationGeocode);
router.post('/signup', AccountController.signup);
router.post('/signin', AccountController.signin);
router.delete('/:userid', checkJWT, AccountController.deleteAccount);
router.put('/:userid', checkJWT, AccountController.modifyAccountData);
router.post('/resetPwd', checkJWT, AccountController.resetPassword);
router.get('/activate_account', AccountController.activateAccount);
router.put('/chat/:roomkey', AccountController.storeChatMessage);
router.put('/groupchat/:roomkey', AccountController.storeGroupChatMessage);
router.post('/:userid/article',upload.single('file'), AccountController.newArticle);
router.put('/:userid/article/:artid', upload.single('file'), AccountController.editArticle);
router.delete('/:userid/article/:artid',deleteFile, AccountController.deleteArticle)
router.delete('/:userid/article/:artid/img', deleteFile, AccountController.deleteArticleImage)
router.get('/:userid/chat/:linxuserid', AccountController.getChats)
router.put('/:userid/chat', AccountController.markMessagesAsRead)
router.get('/places/:cityid', AccountController.getPlaceDetails)
router.get('/:userid/articles', AccountController.getAccountArticles)
module.exports = router;