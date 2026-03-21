# Payment API Documentation

Base URL: `http://localhost:3000/api`

---

## 1. Danh sách ngân hàng

### `GET /payment/banks`

Lấy danh sách ngân hàng Việt Nam hỗ trợ VietQR.

**Request:**
```http
GET /api/payment/banks
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 17,
      "name": "Ngân hàng TMCP Quân đội",
      "code": "MB",
      "bin": "970422",
      "shortName": "MBBank",
      "logo": "https://api.vietqr.io/img/MB.png",
      "transferSupported": 1,
      "lookupSupported": 1,
      "swiftCode": "MSCBVNVX"
    },
    {
      "id": 43,
      "name": "Ngân hàng TMCP Ngoại Thương Việt Nam",
      "code": "VCB",
      "bin": "970436",
      "shortName": "Vietcombank",
      "logo": "https://api.vietqr.io/img/VCB.png",
      "transferSupported": 1,
      "lookupSupported": 1,
      "swiftCode": "BFTVVNVX"
    }
    // ... more banks
  ]
}
```

---

### `GET /payment/banks/:bankId`

Lấy thông tin 1 ngân hàng theo BIN hoặc code.

**Request:**
```http
GET /api/payment/banks/970422
# hoặc
GET /api/payment/banks/MB
# hoặc
GET /api/payment/banks/MBBank
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 17,
    "name": "Ngân hàng TMCP Quân đội",
    "code": "MB",
    "bin": "970422",
    "shortName": "MBBank",
    "logo": "https://api.vietqr.io/img/MB.png",
    "transferSupported": 1,
    "lookupSupported": 1,
    "swiftCode": "MSCBVNVX"
  }
}
```

---

## 2. Tạo QR Code

### `POST /payment/generate-qr`

Tạo VietQR nhanh (không tạo transaction, chỉ generate link).

**Request:**
```http
POST /api/payment/generate-qr
Content-Type: application/json

{
  "amount": 100000,
  "description": "Thanh toan don hang"
}
```

**Request với options:**
```json
{
  "amount": 100000,
  "description": "Thanh toan don hang",
  "bankId": "970422",
  "accountNo": "0343150904",
  "accountName": "TRAN XUAN MINH",
  "template": "compact2"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | number | ✅ | Số tiền (1,000 - 999,999,999,999) |
| description | string | ✅ | Nội dung CK (max 50 ký tự, không dấu) |
| bankId | string | ❌ | Mã BIN hoặc code ngân hàng |
| accountNo | string | ❌ | Số tài khoản |
| accountName | string | ❌ | Tên chủ tài khoản |
| template | string | ❌ | compact2, compact, qr_only, print |

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "https://img.vietqr.io/image/970422-0343150904-compact2.png?amount=100000&addInfo=Thanh%20toan%20don%20hang&accountName=TRAN%20XUAN%20MINH",
    "qrDataUrl": "https://img.vietqr.io/image/970422-0343150904-qr_only.png?amount=100000&addInfo=Thanh%20toan%20don%20hang&accountName=TRAN%20XUAN%20MINH",
    "bankCode": "970422",
    "bankName": "MB Bank",
    "accountNo": "0343150904",
    "accountName": "TRAN XUAN MINH",
    "amount": 100000,
    "description": "Thanh toan don hang"
  }
}
```

---

## 3. Tạo Transaction (gắn với Order)

### `POST /payment/create` 🔐

Tạo giao dịch thanh toán cho 1 order.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Request:**
```http
POST /api/payment/create
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentMethod": "bank_transfer"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderId | string (UUID) | ✅ | ID của order cần thanh toán |
| paymentMethod | string | ❌ | "bank_transfer" (default) hoặc "cod" |

**Response Success:**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transactionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "transactionCode": "TXNM1ABC2XYZ",
    "amount": 1590000,
    "qrCodeUrl": "https://img.vietqr.io/image/970422-0343150904-compact2.png?amount=1590000&addInfo=TXNM1ABC2XYZ&accountName=TRAN%20XUAN%20MINH",
    "bankCode": "970422",
    "bankName": "MB Bank",
    "accountNo": "0343150904",
    "accountName": "TRAN XUAN MINH",
    "expiredAt": "2024-01-15T10:30:00.000Z",
    "paymentInstructions": {
      "step1": "Open your banking app and scan the QR code",
      "step2": "Transfer exactly 1,590,000 VND",
      "step3": "Payment description should contain: TXNM1ABC2XYZ",
      "step4": "After transfer, click \"Check Payment\" to verify"
    }
  }
}
```

**Response Error - Order not found:**
```json
{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}
```

**Response Error - Order already paid:**
```json
{
  "statusCode": 400,
  "message": "Order is not in pending status",
  "error": "Bad Request"
}
```

---

## 4. Kiểm tra thanh toán

### `POST /payment/check` 🔐

Kiểm tra trạng thái thanh toán (gọi khi user bấm nút "Kiểm tra").

**Request:**
```http
POST /api/payment/check
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "transactionCode": "TXNM1ABC2XYZ"
}
```

**Response - Pending (chưa thanh toán):**
```json
{
  "success": true,
  "data": {
    "status": "pending",
    "message": "Payment is still pending",
    "transaction": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "transactionCode": "TXNM1ABC2XYZ",
      "amount": 1590000,
      "paidAt": null,
      "bankTransactionId": null
    }
  }
}
```

**Response - Completed (đã thanh toán):**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "message": "Payment confirmed successfully",
    "transaction": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "transactionCode": "TXNM1ABC2XYZ",
      "amount": 1590000,
      "paidAt": "2024-01-15T10:25:00.000Z",
      "bankTransactionId": "FT24015XXXXX"
    }
  }
}
```

**Response - Expired (hết hạn):**
```json
{
  "success": true,
  "data": {
    "status": "expired",
    "message": "Transaction has expired",
    "transaction": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "transactionCode": "TXNM1ABC2XYZ",
      "amount": 1590000,
      "paidAt": null,
      "bankTransactionId": null
    }
  }
}
```

---

### `GET /payment/check/:transactionCode` 🔐

Giống POST nhưng dùng GET.

**Request:**
```http
GET /api/payment/check/TXNM1ABC2XYZ
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 5. Lấy QR Code của Transaction

### `GET /payment/qrcode/:transactionCode`

Lấy thông tin QR của transaction đã tạo.

**Request:**
```http
GET /api/payment/qrcode/TXNM1ABC2XYZ
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionCode": "TXNM1ABC2XYZ",
    "qrCodeUrl": "https://img.vietqr.io/image/970422-0343150904-compact2.png?amount=1590000&addInfo=TXNM1ABC2XYZ",
    "amount": 1590000,
    "bankCode": "970422",
    "bankName": "MB Bank",
    "accountNo": "0343150904",
    "accountName": "TRAN XUAN MINH",
    "status": "pending",
    "expiredAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 6. Lịch sử giao dịch

### `GET /payment/transactions` 🔐

Lấy tất cả giao dịch của user đang đăng nhập.

**Request:**
```http
GET /api/payment/transactions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "transactionCode": "TXNM1ABC2XYZ",
      "orderId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-uuid",
      "amount": 1590000,
      "paymentMethod": "bank_transfer",
      "status": "completed",
      "bankCode": "970422",
      "bankName": "MB Bank",
      "accountNo": "0343150904",
      "accountName": "TRAN XUAN MINH",
      "qrCodeUrl": "https://img.vietqr.io/image/...",
      "bankTransactionId": "FT24015XXXXX",
      "paidAt": "2024-01-15T10:25:00.000Z",
      "expiredAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:25:00.000Z",
      "order": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "status": "confirmed",
        "totalAmount": 1590000
      }
    }
  ]
}
```

---

### `GET /payment/transactions/:id` 🔐

Lấy chi tiết 1 giao dịch.

**Request:**
```http
GET /api/payment/transactions/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### `GET /payment/order/:orderId` 🔐

Lấy tất cả giao dịch của 1 order.

**Request:**
```http
GET /api/payment/order/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 7. Hủy giao dịch

### `DELETE /payment/transactions/:id` 🔐

Hủy giao dịch đang pending.

**Request:**
```http
DELETE /api/payment/transactions/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction cancelled successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "cancelled"
  }
}
```

---

## 8. Admin APIs

### `POST /payment/confirm/:transactionCode` 🔐👑

Admin xác nhận thanh toán thủ công.

**Request:**
```http
POST /api/payment/confirm/TXNM1ABC2XYZ?bankTransactionId=FT24015XXXXX
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "completed",
    "paidAt": "2024-01-15T10:25:00.000Z"
  }
}
```

---

### `POST /payment/cleanup` 🔐👑

Dọn dẹp các giao dịch hết hạn.

**Request:**
```http
POST /api/payment/cleanup
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 5 expired transactions"
}
```

---

## 9. Webhook (cho Casso/Sepay)

### `POST /payment/webhook`

Webhook để service bên thứ 3 gọi khi có giao dịch.

**Request:**
```http
POST /api/payment/webhook
Content-Type: application/json
X-Webhook-Secret: your_webhook_secret

{
  "transactionCode": "TXNM1ABC2XYZ",
  "amount": 1590000,
  "bankTransactionId": "FT24015XXXXX",
  "description": "TXNM1ABC2XYZ thanh toan"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed"
}
```

---

## Flow thanh toán hoàn chỉnh

```
┌─────────────────────────────────────────────────────────────┐
│  1. User tạo order                                          │
│     POST /api/orders                                        │
│     → orderId: "550e8400-..."                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. User tạo transaction thanh toán                         │
│     POST /api/payment/create                                │
│     Body: { "orderId": "550e8400-..." }                     │
│     → transactionCode: "TXNM1ABC2XYZ"                       │
│     → qrCodeUrl: "https://img.vietqr.io/..."                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. User scan QR và chuyển khoản                            │
│     - Số tiền: 1,590,000 VND                                │
│     - Nội dung: TXNM1ABC2XYZ                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. User bấm "Kiểm tra thanh toán"                          │
│     POST /api/payment/check                                 │
│     Body: { "transactionCode": "TXNM1ABC2XYZ" }             │
│                                                             │
│     → Hệ thống gọi MB Bank API check lịch sử giao dịch      │
│     → Tìm giao dịch có nội dung chứa "TXNM1ABC2XYZ"         │
│     → So khớp số tiền                                       │
│     → Nếu OK: status = "completed", order = "confirmed"     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Response                                                │
│     { "status": "completed", "message": "Payment confirmed" }│
└─────────────────────────────────────────────────────────────┘
```

---

## Status codes

| Status | Ý nghĩa |
|--------|---------|
| `pending` | Đang chờ thanh toán |
| `completed` | Đã thanh toán thành công |
| `expired` | Hết hạn (30 phút) |
| `cancelled` | Đã hủy |
| `failed` | Thất bại |

---

## Enums

### PaymentMethod
```typescript
enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  COD = 'cod',
}
```

### PaymentStatus
```typescript
enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}
```
