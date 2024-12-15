const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

router.get('/stream/:videoId', videoController.streamVideo);
router.get('/chunk/:videoId/:chunkIndex', videoController.getVideoChunk);
router.post('/process/:videoId', videoController.processVideo);
router.get('/metadata/:videoId', videoController.getVideoMetadata);

module.exports = router;
