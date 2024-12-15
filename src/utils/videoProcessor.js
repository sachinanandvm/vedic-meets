const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const path = require('path');
const fs = require('fs').promises;

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

class VideoProcessor {
    constructor() {
        this.chunksDir = path.join(__dirname, '../../chunks');
        this.videosDir = path.join(__dirname, '../../videos');
        this.initializeDirs();
    }

    async initializeDirs() {
        try {
            await fs.mkdir(this.chunksDir, { recursive: true });
            await fs.mkdir(this.videosDir, { recursive: true });
        } catch (error) {
            console.error('Error creating directories:', error);
        }
    }

    async processVideo(videoId) {
        const videoPath = path.join(this.videosDir, `${videoId}.mp4`);
        const outputPath = path.join(this.chunksDir, videoId);

        try {
            await fs.mkdir(outputPath, { recursive: true });

            return new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .outputOptions([
                        '-c:v libx264',         // Video codec
                        '-c:a aac',             // Audio codec
                        '-f segment',           // Segment format
                        '-segment_time 10',     // 10-second segments
                        '-reset_timestamps 1',   // Reset timestamps
                        '-map 0',               // Map all streams
                        '-segment_format mp4'    // Output format
                    ])
                    .output(path.join(outputPath, 'chunk_%03d.mp4'))
                    .on('end', () => {
                        console.log('Video processing completed');
                        resolve(this.getChunkInfo(videoId));
                    })
                    .on('error', (error) => {
                        console.error('Error processing video:', error);
                        reject(error);
                    })
                    .run();
            });
        } catch (error) {
            throw new Error(`Failed to process video: ${error.message}`);
        }
    }

    async getChunkInfo(videoId) {
        const chunkDir = path.join(this.chunksDir, videoId);
        try {
            const files = await fs.readdir(chunkDir);
            const chunkFiles = files.filter(file => file.startsWith('chunk_') && file.endsWith('.mp4'));
            
            return {
                totalChunks: chunkFiles.length,
                chunks: chunkFiles.sort(),
                directory: chunkDir
            };
        } catch (error) {
            throw new Error(`Failed to get chunk info: ${error.message}`);
        }
    }

    async getVideoMetadata(videoId) {
        const videoPath = path.join(this.videosDir, `${videoId}.mp4`);
        
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (error, metadata) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                resolve({
                    duration: metadata.format.duration,
                    size: metadata.format.size,
                    bitrate: metadata.format.bit_rate,
                    format: metadata.format.format_name
                });
            });
        });
    }

    async cleanupChunks(videoId) {
        const chunkDir = path.join(this.chunksDir, videoId);
        try {
            await fs.rm(chunkDir, { recursive: true, force: true });
            console.log(`Cleaned up chunks for video ${videoId}`);
        } catch (error) {
            console.error(`Failed to cleanup chunks for video ${videoId}:`, error);
        }
    }
}

module.exports = new VideoProcessor();
