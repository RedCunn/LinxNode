const express = require('express');
const router = express.Router();
const ChainController = require('../controllers/chain_controller');

router.get('/', ChainController.getChainsByIds)
router.post('/', ChainController.inviteToChain);
router.get('/:name', ChainController.checkNameAvailability);
router.get('/:chainid/user/:userid/linxs', ChainController.getMyLinxs);

router.get('/:userid/chainreqs', ChainController.getJoinChainRequests);
router.post('/:userid/:linxuserid', ChainController.requestChain);
router.delete('/:userid/chain/:chainid/linx/:linxuserid', ChainController.breakChain);
router.delete('/:userid/chainreq/:linxuserid', ChainController.rejectJoinChainRequest)
router.get('/:userid/extents/:linxuserid', ChainController.getChainLinxExtents)
router.get('/:userid/extendedchain/:chainid', ChainController.getExtendedChains)
router.get('/:userid', ChainController.getAllUserChains)
router.delete('/chainid/admin/:adminid/linx/:linxid', ChainController.removeLinxLeavingExtents)

module.exports = router;