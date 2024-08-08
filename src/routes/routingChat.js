const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat_controller');

router.get('/:roomkey', ChatController.getChat);
router.get('/user/:userid', ChatController.getChats);
router.put('/:roomkey/user/:userid', ChatController.markAsRead);
router.put('/:roomkey', ChatController.storeMessage);
router.put('/group/:roomkey', ChatController.storeGroupMessage);

module.exports = router;