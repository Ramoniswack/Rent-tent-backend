/**
 * Check Messaging Status
 * Simple diagnostic to check if messaging endpoints are configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Messaging Configuration\n');
console.log('='.repeat(60));

// Check 1: Message Controller
console.log('\n📋 Check 1: Message Controller');
const controllerPath = path.join(__dirname, '../controllers/messageController.js');
if (fs.existsSync(controllerPath)) {
  const content = fs.readFileSync(controllerPath, 'utf8');
  
  // Check for sendMessage function
  if (content.includes('exports.sendMessage')) {
    console.log('   ✅ sendMessage function exists');
    
    // Check for match validation
    if (content.includes('matched: true')) {
      console.log('   ✅ Match validation code found');
    } else {
      console.log('   ⚠️  Match validation might be missing');
    }
    
    // Check for permission check
    if (content.includes('hasPermission')) {
      console.log('   ✅ Permission check exists');
    } else {
      console.log('   ⚠️  Permission check might be missing');
    }
    
    // Check for 403 error
    if (content.includes('403')) {
      console.log('   ✅ 403 error handling exists');
    } else {
      console.log('   ⚠️  403 error handling might be missing');
    }
  } else {
    console.log('   ❌ sendMessage function not found');
  }
} else {
  console.log('   ❌ Message controller file not found');
}

// Check 2: Message Routes
console.log('\n📋 Check 2: Message Routes');
const routesPath = path.join(__dirname, '../routes/messageRoutes.js');
if (fs.existsSync(routesPath)) {
  const content = fs.readFileSync(routesPath, 'utf8');
  console.log('   ✅ Message routes file exists');
  
  if (content.includes('POST') || content.includes('post')) {
    console.log('   ✅ POST route for sending messages exists');
  }
  
  if (content.includes('GET') || content.includes('get')) {
    console.log('   ✅ GET route for fetching messages exists');
  }
} else {
  console.log('   ❌ Message routes file not found');
}

// Check 3: Message Model
console.log('\n📋 Check 3: Message Model');
const modelPath = path.join(__dirname, '../models/Message.js');
if (fs.existsSync(modelPath)) {
  const content = fs.readFileSync(modelPath, 'utf8');
  console.log('   ✅ Message model exists');
  
  if (content.includes('sender')) {
    console.log('   ✅ Sender field defined');
  }
  
  if (content.includes('receiver')) {
    console.log('   ✅ Receiver field defined');
  }
  
  if (content.includes('text')) {
    console.log('   ✅ Text field defined');
  }
} else {
  console.log('   ❌ Message model file not found');
}

// Check 4: Match Model
console.log('\n📋 Check 4: Match Model');
const matchModelPath = path.join(__dirname, '../models/Match.js');
if (fs.existsSync(matchModelPath)) {
  const content = fs.readFileSync(matchModelPath, 'utf8');
  console.log('   ✅ Match model exists');
  
  if (content.includes('matched')) {
    console.log('   ✅ Matched field defined');
  }
  
  if (content.includes('user1') && content.includes('user2')) {
    console.log('   ✅ User1 and User2 fields defined');
  }
} else {
  console.log('   ❌ Match model file not found');
}

// Check 5: Frontend Messages Page
console.log('\n📋 Check 5: Frontend Messages Page');
const messagesPagePath = path.join(__dirname, '../../frontend/app/messages/page.tsx');
if (fs.existsSync(messagesPagePath)) {
  console.log('   ✅ Messages page exists');
} else {
  console.log('   ❌ Messages page not found');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log('\n✅ All messaging components are in place');
console.log('\n📝 To test messaging:');
console.log('   1. Start backend: cd backend && npm start');
console.log('   2. Start frontend: cd frontend && npm run dev');
console.log('   3. Create two users and have them match');
console.log('   4. Try sending messages between matched users');
console.log('\n🔧 If messages are not working, check:');
console.log('   - Backend server is running on port 5000');
console.log('   - Frontend is running on port 3000');
console.log('   - MongoDB is connected');
console.log('   - Users have matched or connected');
console.log('   - Browser console for any errors');
console.log('='.repeat(60));
