const express = require('express');
const router = express.Router();
const SearchmediaController = require('../controllers/searchmedia_controller');

router.get('/items', SearchmediaController.fetchSpotifyItems);
router.get('/games', SearchmediaController.fetchGames);
router.get('/films', SearchmediaController.fetchFilms);
router.get('/books', SearchmediaController.fetchBooks);

module.exports = router;