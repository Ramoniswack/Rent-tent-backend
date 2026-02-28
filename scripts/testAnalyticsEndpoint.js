const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAnalytics() {
  try {
    // Login as admin
    console.log('Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'bishalbaniya614@gmail.com',
      password: 'bishal123'
    });

    const token = loginRes.data.token;
    console.log('✅ Logged in successfully\n');

    // Get analytics
    console.log('Fetching analytics data...');
    const analyticsRes = await axios.get(`${API_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Analytics data retrieved:\n');
    console.log('Total Revenue:', analyticsRes.data.totalRevenue);
    console.log('Commission Revenue:', analyticsRes.data.commissionRevenue);
    console.log('Wallet Recharges:', analyticsRes.data.walletRecharges);
    console.log('Total Bookings:', analyticsRes.data.totalBookings);
    console.log('Completed Bookings:', analyticsRes.data.completedBookings);
    console.log('Active Bookings:', analyticsRes.data.activeBookings);
    console.log('Total Users:', analyticsRes.data.totalUsers);
    console.log('Total Gear:', analyticsRes.data.totalGear);
    console.log('Revenue Growth:', analyticsRes.data.revenueGrowth + '%');
    console.log('Bookings Growth:', analyticsRes.data.bookingsGrowth + '%');
    console.log('\nMonthly Revenue:', analyticsRes.data.monthlyRevenue);
    console.log('\nRecent Transactions:', analyticsRes.data.recentTransactions.slice(0, 5));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAnalytics();
