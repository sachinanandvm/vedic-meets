const videoService = require('../services/videoService');
const fs = require('fs');
const path = require('path');

exports.streamVideo = async (req, res) => {
    const { videoId } = req.params;
    try {
        const videoPath = path.join(__dirname, '../../videos', `${videoId}.mp4`);
        
        // Check if video exists
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Get video stats
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // Parse range
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            // No range requested
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({ error: 'Error streaming video' });
    }
};

exports.getVideoChunk = async (req, res) => {
  const { videoId, chunkIndex } = req.params;
  try {
    const chunk = await videoService.getChunk(videoId, chunkIndex);
    res.json(chunk);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chunk' });
  }
};

exports.processVideo = async (req, res) => {
    const { videoId } = req.params;
    try {
        const chunkInfo = await videoService.processAndGetChunks(videoId);
        res.json({
            success: true,
            data: chunkInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.getVideoMetadata = async (req, res) => {
    const { videoId } = req.params;
    try {
        const metadata = await videoService.getVideoMetadata(videoId);
        res.json({
            success: true,
            data: metadata
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
