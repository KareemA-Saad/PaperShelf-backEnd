# PaperShelf API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`
- Request: `{ "name": "John Doe", "email": "john@example.com", "password": "Password123!" }`
- Response: Success message, user info, tokens

### Login User
**POST** `/auth/login`
- Request: `{ "email": "john@example.com", "password": "Password123!" }`
- Response: Success message, user info, tokens

### Logout User
**POST** `/auth/logout`
- Request: `{ "refreshToken": "..." }`
- Response: Success message

### Refresh Token
**POST** `/auth/refresh-token`
- Request: `{ "refreshToken": "..." }`
- Response: New access/refresh tokens

### Verify Email (OTP)
**POST** `/auth/verify-email`
- Request: `{ "otp": "123456" }`
- Response: Success message

### Resend Verification OTP
**POST** `/auth/resend-verification`
- Request: `{ "email": "john@example.com" }`
- Response: Success message

### Request Password Reset
**POST** `/auth/request-password-reset`
- Request: `{ "email": "john@example.com" }`
- Response: Success message

### Reset Password (OTP)
**POST** `/auth/reset-password`
- Request: `{ "otp": "654321", "newPassword": "NewPassword123!" }`
- Response: Success message

---

## User & Admin Endpoints

### List All Users (Admin Only)
**GET** `/users/`
- Headers: `Authorization: Bearer <admin_access_token>`
- Response: List of users (no passwords)

### Get User by ID (Admin Only)
**GET** `/users/:id`
- Headers: `Authorization: Bearer <admin_access_token>`
- Response: User info (no password)

### Update User Info (Self or Admin)
**PATCH** `/users/:id`
- Headers: `Authorization: Bearer <access_token>`
- Request: `{ "name": "New Name", "email": "new@example.com" }`
- Response: Updated user info

### Delete User by ID (Admin Only)
**DELETE** `/users/:id`
- Headers: `Authorization: Bearer <admin_access_token>`
- Response: Success message

### Delete Own Account
**DELETE** `/users/me`
- Headers: `Authorization: Bearer <access_token>`
- Response: Success message

### Change User Role (Admin Only)
**PATCH** `/users/:id/role`
- Headers: `Authorization: Bearer <admin_access_token>`
- Request: `{ "role": "admin" }` (or "user", "author")
- Response: Success message

---

## Error Responses
All error responses follow this format:
```json
{
  "success": false,
  "message": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Flow
1. Register → Email verification (OTP)
2. Login → Get access/refresh tokens
3. Use access token for protected routes
4. Refresh token when access token expires

---

## Roles & Access
- **User:** Register, login, update/delete own account
- **Admin:** All user management features
- **Author:** (future/optional)

---

## Testing
- Use [Postman](https://www.postman.com/) or similar tools
- Add `Authorization: Bearer <accessToken>` header for protected routes

---

## Environment Variables
See the README for required `.env` variables.

