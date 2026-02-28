const crypto = require('crypto');

// eSewa configuration
const ESEWA_CONFIG = {
  // For testing
  merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
  secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
  paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  verificationUrl: process.env.ESEWA_VERIFICATION_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/',
  
  // For production, use:
  // paymentUrl: 'https://epay.esewa.com.np/api/epay/main/v2/form',
  // verificationUrl: 'https://esewa.com.np/api/epay/transaction/status/',
};

/**
 * Generate HMAC SHA256 signature for eSewa payment
 * @param {string} message - Concatenated string of signed field values
 * @returns {string} Base64 encoded signature
 */
function generateSignature(message) {
  const hmac = crypto.createHmac('sha256', ESEWA_CONFIG.secretKey);
  hmac.update(message);
  return hmac.digest('base64');
}

/**
 * Create eSewa payment parameters
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Product amount
 * @param {number} params.taxAmount - Tax amount (0 if not applicable)
 * @param {number} params.serviceCharge - Service charge (0 if not applicable)
 * @param {number} params.deliveryCharge - Delivery charge (0 if not applicable)
 * @param {string} params.transactionUuid - Unique transaction ID
 * @param {string} params.successUrl - Success redirect URL
 * @param {string} params.failureUrl - Failure redirect URL
 * @returns {Object} Payment form parameters
 */
function createPaymentParams(params) {
  const {
    amount,
    taxAmount = 0,
    serviceCharge = 0,
    deliveryCharge = 0,
    transactionUuid,
    successUrl,
    failureUrl
  } = params;

  // Calculate total amount
  const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;

  // Create message for signature (order matters!)
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_CONFIG.merchantCode}`;
  
  // Generate signature
  const signature = generateSignature(message);

  return {
    amount: amount.toString(),
    tax_amount: taxAmount.toString(),
    total_amount: totalAmount.toString(),
    transaction_uuid: transactionUuid,
    product_code: ESEWA_CONFIG.merchantCode,
    product_service_charge: serviceCharge.toString(),
    product_delivery_charge: deliveryCharge.toString(),
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: signedFieldNames,
    signature: signature
  };
}

/**
 * Verify eSewa payment response signature
 * @param {Object} response - Response from eSewa
 * @returns {boolean} True if signature is valid
 */
function verifyPaymentResponse(response) {
  const {
    transaction_code,
    status,
    total_amount,
    transaction_uuid,
    product_code,
    signed_field_names,
    signature
  } = response;

  // Recreate the message from signed fields
  const message = `transaction_code=${transaction_code},status=${status},total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code},signed_field_names=${signed_field_names}`;
  
  // Generate signature
  const expectedSignature = generateSignature(message);

  return signature === expectedSignature;
}

/**
 * Check payment status from eSewa
 * @param {string} transactionUuid - Transaction UUID
 * @param {number} totalAmount - Total amount
 * @returns {Promise<Object>} Payment status response
 */
async function checkPaymentStatus(transactionUuid, totalAmount) {
  const url = `${ESEWA_CONFIG.verificationUrl}?product_code=${ESEWA_CONFIG.merchantCode}&total_amount=${totalAmount}&transaction_uuid=${transactionUuid}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('eSewa status check error:', error);
    throw error;
  }
}

/**
 * Generate unique transaction UUID
 * @param {string} userId - User ID
 * @returns {string} Transaction UUID
 */
function generateTransactionUuid(userId) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${userId.slice(-6)}-${timestamp}-${random}`;
}

module.exports = {
  ESEWA_CONFIG,
  generateSignature,
  createPaymentParams,
  verifyPaymentResponse,
  checkPaymentStatus,
  generateTransactionUuid
};
