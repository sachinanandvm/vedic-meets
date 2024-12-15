const VideoProcessor = require('../src/utils/videoProcessor');
const path = require('path');
const fs = require('fs');

async function runTests() {
    try {
        console.log('Starting video processing tests...');

        // Test 1: Check if directories exist
        console.log('\nTest 1: Checking directories...');
        const chunksExist = fs.existsSync(path.join(__dirname, '../chunks'));
        const videosExist = fs.existsSync(path.join(__dirname, '../videos'));
        console.log('Chunks directory exists:', chunksExist);
        console.log('Videos directory exists:', videosExist);

        // Test 2: Process a sample video
        console.log('\nTest 2: Processing sample video...');
        const videoId = 'video1';
        const chunkInfo = await VideoProcessor.processVideo(videoId);
        console.log('Chunk info:', chunkInfo);

        // Test 3: Get video metadata
        console.log('\nTest 3: Getting video metadata...');
        const metadata = await VideoProcessor.getVideoMetadata(videoId);
        console.log('Video metadata:', metadata);

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTests();
