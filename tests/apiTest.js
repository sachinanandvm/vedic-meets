const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/videos';

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

testAPI();
