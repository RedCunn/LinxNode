const express = require('express');
const router = express.Router();
const MatchingController = require('../controllers/matching_controller');

router.get('/:userid/shuffledProfiles', MatchingController.shuffleProfiles);
router.post('/:userid/:linxuserid', MatchingController.matchLinxs);
router.get('/:userid/matches', MatchingController.getMatches);
router.delete('/:userid/match/:matchuserid', MatchingController.unMatchUsers)
module.exports = router;