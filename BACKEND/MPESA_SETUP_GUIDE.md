# M-Pesa STK Push Integration Setup Guide

## 🚀 Complete M-Pesa Payment System Implementation

This guide covers the complete implementation of M-Pesa STK Push payments using the official Safaricom Daraja API.

## 📋 Features Implemented

### ✅ Backend Components
- **OAuth Token Generation**: Secure access token retrieval from Safaricom
- **STK Push Initiation**: Complete STK push request with proper validation
- **Phone Number Sanitization**: Handles multiple phone formats (0712345678, +254712345678, etc.)
- **Base64 Password Generation**: Secure password using Shortcode + Passkey + Timestamp
- **Database Integration**: Payment, Transaction, and PaymentResponse models
- **Callback Handling**: Asynchronous payment status updates
- **Error Handling**: Comprehensive error handling for all scenarios

### ✅ API Endpoints
- `POST /payments/mpesa/stkpush` - Initiate STK push payment
- `POST /payments/callback` - Handle Safaricom callbacks
- `GET /payments/mpesa/status/<checkout_request_id>` - Check payment status
- `GET /payments/test-mpesa-config` - Test configuration

### ✅ Frontend Integration
- **World-class M-Pesa UI**: Elegant payment card with auto-fill
- **Phone Number Auto-sync**: Uses billing phone with manual override option
- **Payment Status Polling**: Real-time status updates
- **Error Handling**: User-friendly error messages

## 🔧 Configuration

### Environment Variables (.env)
```bash
# M-Pesa sandbox credentials (PROVIDED)
MPESA_CONSUMER_KEY=BCjpmMKEzK95mr7AwYYkSCQhjCCgiqyV9lhsch1ETO39lpAx
MPESA_CONSUMER_SECRET=duoaeGtyLHSS0nKbBfuy9qRDv74AAGNKEKCudzXD0QGD2B1qcchbwpOSAW9FhQYA
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://19c97f230157.ngrok-free.app/callback
MPESA_ENVIRONMENT=sandbox
```

### API URLs (Auto-configured)
- **Sandbox Auth**: `https://sandbox.safaricom.co.ke/oauth/v1/generate`
- **Sandbox STK Push**: `https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`

## 🧪 Testing

### 1. Test Configuration
```bash
cd BACKEND
python test_mpesa_integration.py
```

### 2. Test Backend Endpoints
```bash
# Start backend
python start_server.py

# Test config (in another terminal)
curl http://localhost:5000/payments/test-mpesa-config
```

### 3. Test STK Push
```bash
curl -X POST http://localhost:5000/payments/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phone_number": "254712345678",
    "order_id": 123,
    "amount": 100
  }'
```

## 📱 Phone Number Formats Supported

The system automatically handles these formats:
- `0712345678` → `254712345678`
- `+254712345678` → `254712345678`
- `254712345678` → `254712345678`
- `712345678` → `254712345678`

## 🔄 Payment Flow

### 1. Frontend Initiation
```javascript
// User fills checkout form with M-Pesa phone
const paymentData = {
  phone_number: "254712345678",
  order_id: 123,
  amount: 1000
};

// Initiate STK push
const response = await fetch('/payments/mpesa/stkpush', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(paymentData)
});
```

### 2. Backend Processing
1. **Validate Input**: Phone, amount, order ownership
2. **Get Access Token**: OAuth with Safaricom
3. **Sanitize Phone**: Convert to 2547XXXXXXXX format
4. **Generate Password**: Base64(Shortcode + Passkey + Timestamp)
5. **Send STK Push**: POST to Safaricom API
6. **Save Payment**: Create Payment and Transaction records
7. **Return Response**: CheckoutRequestID for polling

### 3. Safaricom Callback
```json
{
  "Body": {
    "stkCallback": {
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CheckoutRequestID": "ws_CO_1234567890",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 1000},
          {"Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV"},
          {"Name": "PhoneNumber", "Value": 254712345678}
        ]
      }
    }
  }
}
```

### 4. Status Polling
```javascript
// Frontend polls for status
const checkStatus = async (checkoutRequestId) => {
  const response = await fetch(`/payments/mpesa/status/${checkoutRequestId}`);
  const data = await response.json();
  
  if (data.status === 'COMPLETED') {
    // Payment successful
    showSuccessMessage();
  } else if (data.status === 'FAILED') {
    // Payment failed
    showErrorMessage();
  } else {
    // Still pending, poll again
    setTimeout(() => checkStatus(checkoutRequestId), 3000);
  }
};
```

## 🛠️ Error Handling

### Common Errors & Solutions

#### 1. Invalid Credentials (400)
```
Error: Invalid MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET
```
**Solution**: Verify credentials in .env file

#### 2. Invalid Phone Number
```
Error: Invalid phone number format
```
**Solution**: Use formats like 0712345678, +254712345678, or 254712345678

#### 3. Network Timeout
```
Error: Network error fetching M-pesa access token
```
**Solution**: Check internet connection and Safaricom API status

#### 4. Callback URL Not Accessible
```
Error: Callback processing failed
```
**Solution**: Ensure ngrok is running and URL is accessible

## 🚀 Production Deployment

### 1. Update Environment
```bash
# Change to production
MPESA_ENVIRONMENT=production
MPESA_SHORTCODE=YOUR_PRODUCTION_SHORTCODE
MPESA_PASSKEY=YOUR_PRODUCTION_PASSKEY
MPESA_CALLBACK_URL=https://yourdomain.com/payments/callback
```

### 2. SSL Certificate
- Ensure callback URL uses HTTPS
- Valid SSL certificate required for production

### 3. Security
- Store credentials securely (not in code)
- Use environment variables
- Implement rate limiting
- Log all transactions

## 📊 Database Schema

### Payment Table
```sql
CREATE TABLE payments (
    payment_id INTEGER PRIMARY KEY,
    payment_amount VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    payment_method_id INTEGER NOT NULL
);
```

### Transaction Table
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE,
    amount FLOAT,
    phone_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PENDING',
    mpesa_receipt_number VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL
);
```

### PaymentResponse Table
```sql
CREATE TABLE payment_response (
    id INTEGER PRIMARY KEY,
    response_code VARCHAR(10) NOT NULL,
    response_description VARCHAR(255),
    merchant_request_id VARCHAR(100),
    checkout_request_id VARCHAR(100),
    result_code VARCHAR(10),
    result_description VARCHAR(255),
    raw_callback JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_id INTEGER NOT NULL
);
```

## 🎯 Success Criteria

✅ **Complete Implementation**
- OAuth token generation working
- STK push initiation successful
- Phone number sanitization working
- Database integration complete
- Callback handling implemented
- Frontend integration complete
- Error handling comprehensive
- Testing framework ready

✅ **Production Ready**
- Environment configuration
- Security best practices
- Comprehensive logging
- Error handling
- Database transactions
- API documentation

## 🔗 Useful Links

- [Safaricom Daraja API Documentation](https://developer.safaricom.co.ke/docs)
- [M-Pesa STK Push Guide](https://developer.safaricom.co.ke/docs#stk-push)
- [Sandbox Testing](https://developer.safaricom.co.ke/docs#sandbox)
- [ngrok Documentation](https://ngrok.com/docs)

## 📞 Support

For issues or questions:
1. Check the logs in your Flask application
2. Verify your .env configuration
3. Test with the provided test script
4. Check Safaricom API status
5. Verify ngrok tunnel is active

---

**🎉 Your M-Pesa STK Push integration is now complete and production-ready!**
