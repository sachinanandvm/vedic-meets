
## Overview
This is a video streaming application that processes MP4 videos into chunks for efficient streaming. It uses FFmpeg for video processing and includes comprehensive testing at multiple levels.

## Core Components
### 1. Video Processing
The `VideoProcessor` class (`src/utils/videoProcessor.js`) handles:
- Video chunking using FFmpeg
- Metadata extraction
- File management

```10:105:src/utils/videoProcessor.js
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
```
### 2. Server Setup
Express server with routes for:
- Video streaming
- Chunk delivery
- Video processing
- Metadata retrieval

```1:14:server.js
const express = require('express');
const cors = require('cors');
const videoRoutes = require('./src/routes/videoRoutes');

const app = express();

app.use(cors());
app.use(express.static('public'));
app.use('/api/videos', videoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Testing Infrastructure
### 1. Video Processing Tests (`tests/videoTest.js`)
Tests the core video processing functionality:
- Directory existence checks
- Video processing capabilities
- Metadata extraction

```5:31:tests/videoTest.js
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
```

### 2. API Tests (`tests/apiTest.js`)
Verifies API endpoints:
- Video processing endpoint
- Metadata retrieval
- Chunk delivery

```5:28:tests/apiTest.js
async function testAPI() {
    try {
        console.log('Starting API tests...');

        // Test 1: Process video
        console.log('\nTest 1: Processing video...');
        const processResponse = await axios.post(`${BASE_URL}/process/video1`);
        console.log('Process response:', processResponse.data);

        // Test 2: Get metadata
        console.log('\nTest 2: Getting metadata...');
        const metadataResponse = await axios.get(`${BASE_URL}/metadata/video1`);
        console.log('Metadata response:', metadataResponse.data);

        // Test 3: Get video chunk
        console.log('\nTest 3: Getting video chunk...');
        const chunkResponse = await axios.get(`${BASE_URL}/chunk/video1/000`);
        console.log('Chunk response status:', chunkResponse.status);

        console.log('\nAll API tests completed successfully!');
    } catch (error) {
        console.error('API test failed:', error.response?.data || error.message);
    }
}
```

### 3. Performance Tests (`tests/performanceTest.js`)
Measures critical performance metrics:
1. Video Processing Time
2. Initial Load Time
3. Streaming Latency

```59:91:tests/performanceTest.js
async function runPerformanceTests() {
    try {
        // Test 1: Video Processing Time
        console.log('=== Video Processing Test ===\n');
        console.time('videoProcessing');
        await VideoProcessor.processVideo('video1');
        console.timeEnd('videoProcessing');

        // Test 2: Initial Load Time
        const initialLoadTime = await measureInitialLoadTime();

        // Test 3: Streaming Latency
        const streamingResults = await measureStreamingLatency();

        // Generate report
        const report = {
            timestamp: new Date().toISOString(),
            initialLoadTime,
            streamingLatency: {
                average: streamingResults.reduce((sum, r) => sum + r.latency, 0) / streamingResults.length,
                details: streamingResults
            }
        };

        // Save report
        const reportPath = path.join(__dirname, 'performance-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\nPerformance report saved to ${reportPath}`);

    } catch (error) {
        console.error('Performance test failed:', error);
    }
}
```

### 4. Browser Testing
A test HTML page (`public/test.html`) for manual testing:
- Video player functionality
- API integration
- User interface

```13:31:public/test.html
    <div class="container">
        <h1>Video Streaming Test</h1>
        
        <div>
            <h3>Video Player</h3>
            <video id="videoPlayer" controls width="100%">
                <source src="/api/videos/stream/video1" type="video/mp4">
            </video>
        </div>

        <div>
            <h3>Test Controls</h3>
            <button onclick="processVideo()">Process Video</button>
            <button onclick="getMetadata()">Get Metadata</button>
            <button onclick="testChunks()">Test Chunks</button>
        </div>

        <div id="status"></div>
    </div>
```

## Test Execution Flow
1. **Setup**

```3:11:README.md
1. Install dependencies
npm install

2. Create test directories
mkdir videos
mkdir chunks

3. Add a sample video
# Copy a sample MP4 file to the videos directory and rename it to video1.mp4
```

- Install dependencies
- Create required directories
- Add test video
2. **Video Processing Test**

```13:14:README.md
4. Run the video processing test
npm test
```

- Runs basic video processing tests
- Verifies chunk creation
- Checks metadata extraction
3. **Server Start**

```16:17:README.md
5. Start the server
node server.js
```

- Starts Express server
- Initializes routes
4. **API Tests**

```19:20:README.md
6. In a new terminal, run the API tests
npm run test:api
```

- Tests all API endpoints
- Verifies responses
- Checks error handling
## Why These Tests?
1. **Video Processing Tests**
- Ensure FFmpeg integration works
- Verify chunk creation
- Validate metadata extraction
- Check file system operations
2. **API Tests**
- Verify endpoint functionality
- Ensure correct response formats
- Test error handling
- Validate API contract
3. **Performance Tests**
- Monitor streaming latency
- Measure processing times
- Track initial load performance
- Generate performance reports
4. **Browser Tests**
- Test real-world usage
- Verify player functionality
- Check UI interactions
- Test streaming experience

## Test Configuration
Package.json scripts for running tests:  
```
"scripts": {
    "test": "node tests/videoTest.js",
    "test:api": "node tests/apiTest.js"
  }
```

This comprehensive testing approach ensures:
- Reliable video processing
- Stable API performance
- Good streaming experience
- Proper error handling
- Performance monitoring

The tests are designed to be run sequentially to ensure a complete validation of the system from processing through to delivery.
