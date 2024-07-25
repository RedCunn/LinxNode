const express = require('express');
const router = express.Router();
const ConnectionController = require('../controllers/connection_controller');

router.get('/:userid/shuffledProfiles', ConnectionController.shuffleProfiles);
router.post('/:userid/:linxuserid', ConnectionController.matchLinxs);
router.get('/:userid/matches', ConnectionController.getMatches);
router.delete('/:userid/match/:matchuserid', ConnectionController.unMatchUsers)
module.exports = router;