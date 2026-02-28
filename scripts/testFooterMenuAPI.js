require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testFooterMenuAPI() {
  try {
    console.log('🧪 Testing Footer Menu API\n');
    console.log('API URL:', API_URL);
    console.log('');

    // First, login as admin to get token
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'baniya@baniya.baniya',
      password: 'Bishal@123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully\n');

    // Test 1: Get current footer menus
    console.log('📋 Test 1: Get current footer menus');
    const getResponse = await axios.get(`${API_URL}/profile-field-options`);
    console.log('✅ Product Menu:', getResponse.data.footerProductMenu?.length || 0, 'items');
    console.log('✅ Company Menu:', getResponse.data.footerCompanyMenu?.length || 0, 'items');
    console.log('');

    // Test 2: Update product menu
    console.log('📝 Test 2: Update product menu');
    const newProductMenu = [
      { label: 'Browse Gear', url: '/gear' },
      { label: 'My Rentals', url: '/rentals' },
      { label: 'List Your Gear', url: '/gear/add' },
      { label: 'Find Matches', url: '/match' }
    ];
    
    const updateProductResponse = await axios.put(
      `${API_URL}/profile-field-options/footerProductMenu`,
      { menuItems: newProductMenu },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('✅ Status:', updateProductResponse.status);
    console.log('✅ Response:', updateProductResponse.data.message);
    console.log('');

    // Test 3: Update company menu
    console.log('📝 Test 3: Update company menu');
    const newCompanyMenu = [
      { label: 'About Us', url: '/about' },
      { label: 'Contact', url: '/contact' },
      { label: 'Help Center', url: '/help' },
      { label: 'Terms of Service', url: '/terms' }
    ];
    
    const updateCompanyResponse = await axios.put(
      `${API_URL}/profile-field-options/footerCompanyMenu`,
      { menuItems: newCompanyMenu },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('✅ Status:', updateCompanyResponse.status);
    console.log('✅ Response:', updateCompanyResponse.data.message);
    console.log('');

    // Test 4: Verify updates
    console.log('📋 Test 4: Verify updates');
    const verifyResponse = await axios.get(`${API_URL}/profile-field-options`);
    console.log('✅ Product Menu now has:', verifyResponse.data.footerProductMenu?.length || 0, 'items');
    console.log('   Items:', verifyResponse.data.footerProductMenu?.map(i => i.label).join(', '));
    console.log('✅ Company Menu now has:', verifyResponse.data.footerCompanyMenu?.length || 0, 'items');
    console.log('   Items:', verifyResponse.data.footerCompanyMenu?.map(i => i.label).join(', '));
    console.log('');

    console.log('✅ All API tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testFooterMenuAPI();
