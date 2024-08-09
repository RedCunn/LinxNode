const express = require('express');
const router = express.Router();
const ConnectionController = require('../controllers/connection_controller');

router.get('/:userid/profiles', ConnectionController.shuffleProfiles);
router.post('/:userid/:linxuserid', ConnectionController.connectProfiles);
router.get('/:userid', ConnectionController.getConnections);
router.delete('/:userid/profile/:matchuserid', ConnectionController.unMatchUsers)
module.exports = router;