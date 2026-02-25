const axios = require('axios');

// Cache for TURN credentials to avoid excessive API calls
let turnCredentialsCache = {
  credentials: null,
  expiresAt: null
};

/**
 * Fetch fresh TURN credentials from Metered.ca API
 * @returns {Promise<Object>} TURN credentials with iceServers array
 */
async function fetchTurnCredentials() {
  try {
    const apiKey = process.env.METERED_API_KEY ;
    const apiUrl = 'https://noamdnotes.metered.live/api/v1/turn/credentials';
    
    console.log('Fetching fresh TURN credentials from Metered.ca...');
    
    const response = await axios.get(apiUrl, {
      params: {
        apiKey: apiKey
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.status !== 200) {
      throw new Error(`Metered API returned status ${response.status}`);
    }

    const data = response.data;
    
    // Validate response structure
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid response format from Metered API');
    }

    // Transform Metered.ca response to standard iceServers format
    const iceServers = data.map(server => ({
      urls: server.urls || server.url, // Handle both formats
      username: server.username,
      credential: server.credential
    }));

    // Cache credentials with expiration (Metered credentials typically expire in 24 hours)
    const expirationTime = Date.now() + (23 * 60 * 60 * 1000); // 23 hours to be safe
    
    turnCredentialsCache = {
      credentials: iceServers,
      expiresAt: expirationTime
    };

    console.log(`✅ Successfully fetched ${iceServers.length} TURN servers from Metered.ca`);
    console.log('TURN servers:', iceServers.map(s => ({ urls: s.urls, username: s.username })));
    
    return iceServers;
  } catch (error) {
    console.error('❌ Error fetching TURN credentials from Metered.ca:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Return empty array on error - will fall back to STUN only
    return [];
  }
}

/**
 * Get TURN credentials with caching
 * @returns {Promise<Array>} Array of iceServer objects
 */
async function getTurnCredentials() {
  // Check if cached credentials are still valid
  if (turnCredentialsCache.credentials && 
      turnCredentialsCache.expiresAt && 
      Date.now() < turnCredentialsCache.expiresAt) {
    
    console.log('✅ Using cached TURN credentials');
    return turnCredentialsCache.credentials;
  }

  // Fetch fresh credentials
  return await fetchTurnCredentials();
}

/**
 * Get comprehensive WebRTC configuration with dynamic TURN credentials
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWebRTCConfig = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Base STUN servers (always included for fallback)
    const stunServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ];
    
    // Start with STUN servers
    let iceServers = [...stunServers];
    let hasTurnServer = false;
    let turnServerCount = 0;
    
    try {
      // Fetch dynamic TURN credentials from Metered.ca
      const turnServers = await getTurnCredentials();
      
      if (turnServers && turnServers.length > 0) {
        // Add TURN servers to the configuration
        iceServers = [...stunServers, ...turnServers];
        hasTurnServer = true;
        turnServerCount = turnServers.length;
        
        console.log(`✅ WebRTC config for user ${userId}: ${turnServerCount} TURN servers + ${stunServers.length} STUN servers`);
      } else {
        console.log(`⚠️ WebRTC config for user ${userId}: STUN only (no TURN servers available)`);
      }
    } catch (turnError) {
      console.error('Error fetching TURN credentials, falling back to STUN only:', turnError.message);
      // Continue with STUN-only configuration
    }
    
    // WebRTC configuration optimized for reliability
    const configuration = {
      iceServers,
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all', // Use both STUN and TURN
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
      // Additional reliability settings
      iceConnectionReceivingTimeout: 4000,
      iceInactiveTimeout: 4000
    };
    
    // Response with comprehensive information
    const response = {
      configuration,
      hasTurnServer,
      turnServerCount,
      stunServerCount: stunServers.length,
      totalServers: iceServers.length,
      timestamp: Date.now(),
      cacheStatus: turnCredentialsCache.credentials ? 'cached' : 'fresh',
      cacheExpiresAt: turnCredentialsCache.expiresAt
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error generating WebRTC configuration:', error);
    
    // Fallback configuration with STUN only
    const fallbackConfig = {
      configuration: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      },
      hasTurnServer: false,
      turnServerCount: 0,
      stunServerCount: 2,
      totalServers: 2,
      timestamp: Date.now(),
      error: 'Fallback configuration due to error'
    };
    
    res.status(200).json(fallbackConfig); // Return 200 with fallback config
  }
};

/**
 * Test TURN credentials endpoint for debugging
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.testTurnCredentials = async (req, res) => {
  try {
    console.log('🧪 Testing TURN credentials fetch...');
    
    const startTime = Date.now();
    const credentials = await fetchTurnCredentials();
    const fetchTime = Date.now() - startTime;
    
    const testResult = {
      success: credentials.length > 0,
      credentialCount: credentials.length,
      fetchTimeMs: fetchTime,
      credentials: credentials.map(cred => ({
        urls: cred.urls,
        username: cred.username,
        hasCredential: !!cred.credential
      })),
      cacheStatus: {
        hasCachedCredentials: !!turnCredentialsCache.credentials,
        cacheExpiresAt: turnCredentialsCache.expiresAt,
        cacheValid: turnCredentialsCache.expiresAt && Date.now() < turnCredentialsCache.expiresAt
      },
      timestamp: Date.now()
    };
    
    res.json(testResult);
  } catch (error) {
    console.error('❌ TURN credentials test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
};

/**
 * Force refresh TURN credentials (for admin/debugging)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshTurnCredentials = async (req, res) => {
  try {
    console.log('🔄 Force refreshing TURN credentials...');
    
    // Clear cache to force fresh fetch
    turnCredentialsCache = {
      credentials: null,
      expiresAt: null
    };
    
    const startTime = Date.now();
    const credentials = await fetchTurnCredentials();
    const fetchTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'TURN credentials refreshed successfully',
      credentialCount: credentials.length,
      fetchTimeMs: fetchTime,
      credentials: credentials.map(cred => ({
        urls: cred.urls,
        username: cred.username,
        hasCredential: !!cred.credential
      })),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Failed to refresh TURN credentials:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
};

/**
 * Get cache status for monitoring
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCacheStatus = async (req, res) => {
  try {
    const now = Date.now();
    const cacheValid = turnCredentialsCache.expiresAt && now < turnCredentialsCache.expiresAt;
    const timeUntilExpiry = turnCredentialsCache.expiresAt ? turnCredentialsCache.expiresAt - now : null;
    
    res.json({
      hasCachedCredentials: !!turnCredentialsCache.credentials,
      cacheValid,
      credentialCount: turnCredentialsCache.credentials ? turnCredentialsCache.credentials.length : 0,
      expiresAt: turnCredentialsCache.expiresAt,
      timeUntilExpiryMs: timeUntilExpiry,
      timeUntilExpiryHours: timeUntilExpiry ? Math.round(timeUntilExpiry / (1000 * 60 * 60) * 100) / 100 : null,
      timestamp: now
    });
  } catch (error) {
    console.error('❌ Error getting cache status:', error);
    res.status(500).json({
      error: error.message,
      timestamp: Date.now()
    });
  }
};

module.exports = {
  getWebRTCConfig: exports.getWebRTCConfig,
  testTurnCredentials: exports.testTurnCredentials,
  refreshTurnCredentials: exports.refreshTurnCredentials,
  getCacheStatus: exports.getCacheStatus,
  // Export internal functions for testing
  fetchTurnCredentials,
  getTurnCredentials
};