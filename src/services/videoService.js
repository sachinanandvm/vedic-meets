const videoProcessor = require('../utils/videoProcessor');
const path = require('path');
const fs = require('fs').promises;

class VideoService {
    async processAndGetChunks(videoId) {
        try {
            const chunkInfo = await videoProcessor.processVideo(videoId);
            console.log('chunkInfo', chunkInfo);
            return chunkInfo;
        } catch (error) {
            throw new Error(`Failed to process video: ${error.message}`);
        }
    }

    async getChunk(videoId, chunkIndex) {
        try {
            console.log('getChunk', videoId, chunkIndex);
            const chunkPath = path.join(
                videoProcessor.chunksDir,
                videoId,
                `chunk_${chunkIndex.padStart(3, '0')}.mp4`
            );
            console.log('chunkPath', chunkPath);
            const chunk = await fs.readFile(chunkPath);
            return chunk;
        } catch (error) {
            throw new Error(`Failed to get chunk: ${error.message}`);
        }
    }

    async getVideoMetadata(videoId) {
        try {
            return await videoProcessor.getVideoMetadata(videoId);
        } catch (error) {
            throw new Error(`Failed to get video metadata: ${error.message}`);
        }
    }
}

module.exports = new VideoService();
