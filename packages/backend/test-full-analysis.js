const axios = require('axios');

async function testFullAnalysis() {
  console.log('🧪 Testing full AI analysis with authentication...');
  
  const baseURL = 'http://localhost:9029/api/v1';
  const messageId = '021572d8-b7de-4d1b-a59f-5a3a73a9d48b';
  
  try {
    // Step 1: Login to get valid token
    console.log('1. Attempting login...');
    
    // Try with demo user credentials
    let authResponse;
    try {
      authResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'demo@example.com',
        password: 'demo123' // Common demo password
      });
    } catch (loginError) {
      console.log('⚠️  Login failed (expected in demo), continuing with direct test...');
      
      // Test the endpoint with no auth to see the response
      try {
        const testResponse = await axios.post(`${baseURL}/communication/messages/${messageId}/analyze`, {}, {
          timeout: 10000
        });
        console.log('✅ Endpoint accessible without auth:', testResponse.data);
      } catch (noAuthError) {
        if (noAuthError.response?.status === 401) {
          console.log('✅ Endpoint correctly requires authentication');
          console.log('   Error:', noAuthError.response.data);
        } else if (noAuthError.response?.status === 500) {
          console.log('❌ Server error occurred');
          console.log('   Error:', noAuthError.response.data);
        } else {
          console.log('❌ Unexpected error:', noAuthError.message);
        }
      }
      return;
    }
    
    // Step 2: Test AI analysis with valid token
    console.log('2. Testing AI analysis with authentication...');
    const token = authResponse.data.data?.tokens?.accessToken;
    
    const analysisResponse = await axios.post(`${baseURL}/communication/messages/${messageId}/analyze`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ AI Analysis successful!');
    console.log('📊 Results:', JSON.stringify(analysisResponse.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status);
      console.log('   Message:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to backend server');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testFullAnalysis();