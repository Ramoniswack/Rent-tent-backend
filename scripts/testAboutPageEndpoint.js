const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

const testEndpoint = async () => {
  try {
    console.log('Testing About page endpoint...\n');
    console.log(`GET ${API_URL}/api/pages/about\n`);

    const response = await axios.get(`${API_URL}/api/pages/about`);
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Title:', response.data.title);
    console.log('Slug:', response.data.slug);
    console.log('Has content:', !!response.data.content);
    console.log('Content type:', typeof response.data.content);
    
    if (response.data.content) {
      console.log('\nContent structure:');
      console.log('- Has hero:', !!response.data.content.hero);
      console.log('- Has values:', !!response.data.content.values);
      console.log('- Has mission:', !!response.data.content.mission);
      console.log('- Has team:', !!response.data.content.team);
      console.log('- Has cta:', !!response.data.content.cta);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
};

testEndpoint();
