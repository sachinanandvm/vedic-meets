const VideoProcessor = require('../src/utils/videoProcessor');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function measureStreamingLatency() {
    const chunks = 5; // Test first 5 chunks
    const results = [];
    
    console.log('\n=== Streaming Latency Test ===\n');

    for (let i = 0; i < chunks; i++) {
        const start = Date.now();
        try {
            const response = await axios.get(`http://localhost:3000/api/videos/chunk/video1/${i.toString().padStart(3, '0')}`, {
                responseType: 'arraybuffer'
            });
            const end = Date.now();
            const latency = end - start;
            
            results.push({
                chunk: i,
                latency,
                size: response.data.length,
                status: response.status
            });

            console.log(`Chunk ${i}: ${latency}ms (${(response.data.length / 1024 / 1024).toFixed(2)} MB)`);
        } catch (error) {
            console.error(`Error testing chunk ${i}:`, error.message);
        }
    }

    // Calculate average latency
    const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
    console.log(`\nAverage latency: ${avgLatency.toFixed(2)}ms`);
    
    return results;
}

async function measureInitialLoadTime() {
    console.log('\n=== Initial Load Time Test ===\n');
    
    const start = Date.now();
    try {
        const response = await axios.get('http://localhost:3000/api/videos/metadata/video1');
        const end = Date.now();
        const loadTime = end - start;
        
        console.log(`Initial metadata load time: ${loadTime}ms`);
        console.log('Video metadata:', response.data);
        
        return loadTime;
    } catch (error) {
        console.error('Error measuring initial load time:', error.message);
    }
}

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

// Run tests if server is running
axios.get('http://localhost:3000/')
    .then(() => runPerformanceTests())
    .catch(() => console.error('Please start the server first (npm start)'));