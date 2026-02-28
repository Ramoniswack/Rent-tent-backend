const esewaService = require('../services/esewaService');

console.log('=== eSewa Integration Test ===\n');

// Test 1: Signature Generation
console.log('Test 1: Signature Generation');
console.log('------------------------------');

const testMessage = 'total_amount=110,transaction_uuid=241028,product_code=EPAYTEST';
const expectedSignature = 'i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=';

const generatedSignature = esewaService.generateSignature(testMessage);

console.log('Message:', testMessage);
console.log('Expected Signature:', expectedSignature);
console.log('Generated Signature:', generatedSignature);
console.log('Match:', generatedSignature === expectedSignature ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 2: Payment Parameters Creation
console.log('Test 2: Payment Parameters Creation');
console.log('-------------------------------------');

const paymentParams = esewaService.createPaymentParams({
  amount: 100,
  taxAmount: 10,
  serviceCharge: 0,
  deliveryCharge: 0,
  transactionUuid: '241028',
  successUrl: 'https://developer.esewa.com.np/success',
  failureUrl: 'https://developer.esewa.com.np/failure'
});

console.log('Payment Parameters:');
console.log(JSON.stringify(paymentParams, null, 2));
console.log('Signature matches expected:', paymentParams.signature === expectedSignature ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 3: Transaction UUID Generation
console.log('Test 3: Transaction UUID Generation');
console.log('------------------------------------');

const userId = '507f1f77bcf86cd799439011';
const uuid1 = esewaService.generateTransactionUuid(userId);
const uuid2 = esewaService.generateTransactionUuid(userId);

console.log('User ID:', userId);
console.log('UUID 1:', uuid1);
console.log('UUID 2:', uuid2);
console.log('UUIDs are unique:', uuid1 !== uuid2 ? '✓ PASS' : '✗ FAIL');
console.log('UUID format valid:', /^[a-zA-Z0-9-]+$/.test(uuid1) ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 4: Payment Response Verification
console.log('Test 4: Payment Response Verification');
console.log('---------------------------------------');

const mockResponse = {
  transaction_code: '000AWEO',
  status: 'COMPLETE',
  total_amount: '1000.0',
  transaction_uuid: '250610-162413',
  product_code: 'EPAYTEST',
  signed_field_names: 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names',
  signature: '62GcfZTmVkzhtUeh+QJ1AqiJrjoWWGof3U+eTPTZ7fA='
};

const isValid = esewaService.verifyPaymentResponse(mockResponse);

console.log('Mock Response:');
console.log(JSON.stringify(mockResponse, null, 2));
console.log('Signature valid:', isValid ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 5: Configuration Check
console.log('Test 5: Configuration Check');
console.log('----------------------------');

console.log('Merchant Code:', esewaService.ESEWA_CONFIG.merchantCode);
console.log('Payment URL:', esewaService.ESEWA_CONFIG.paymentUrl);
console.log('Verification URL:', esewaService.ESEWA_CONFIG.verificationUrl);
console.log('Secret Key:', esewaService.ESEWA_CONFIG.secretKey.substring(0, 5) + '...');
console.log();

console.log('=== All Tests Complete ===');
console.log('\nTo test the full payment flow:');
console.log('1. Start the backend server: npm start');
console.log('2. Start the frontend: cd ../frontend && npm run dev');
console.log('3. Login to the application');
console.log('4. Navigate to /wallet');
console.log('5. Click "Recharge" and enter an amount');
console.log('6. You will be redirected to eSewa');
console.log('7. Use test credentials:');
console.log('   - eSewa ID: 9806800001');
console.log('   - Password: Nepal@123');
console.log('   - Token: 123456');
console.log('8. Complete the payment');
console.log('9. You will be redirected back with payment confirmation');
