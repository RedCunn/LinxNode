const express = require('express');
const router = express.Router();
const InteractionController = require('../controllers/interaction_controller');

router.get('/', InteractionController.getInteractions);
router.get('/chain/:chainid/invites', InteractionController.getChainInvites);