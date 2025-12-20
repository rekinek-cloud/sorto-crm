const axios = require('axios');

async function testHttpAnalysis() {
  const messageId = '021572d8-b7de-4d1b-a59f-5a3a73a9d48b';
  const baseURL = 'http://localhost:9029/api/v1';
  
  // First, login to get token (simulate admin user)
  try {
    console.log('Testing HTTP AI Analysis...');
    
    // Simulate the same request that frontend makes
    const response = await axios.post(`${baseURL}/communication/messages/${messageId}/analyze`, {}, {
      headers: {
        'Authorization': 'Bearer fake-token-for-test', // This will fail auth, but shows the endpoint call
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('Success! Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('HTTP Error Response:', error.response.status);
      console.log('Error message:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('✅ Authentication working - endpoint reached but token invalid (expected)');
      } else if (error.response.status === 404) {
        console.log('❌ Endpoint not found - route issue');
      } else {
        console.log('❌ Other error:', error.response.status);
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to backend server');
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testHttpAnalysis();