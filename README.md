# PaperShelf Backend API

A Node.js/Express backend for user authentication, management, and admin features with JWT, email verification (OTP), and role-based access control.

## 🚀 Features
- User registration, login, logout
- JWT authentication (access & refresh tokens)
- Password hashing (bcrypt)
- Email verification with OTP
- Password reset with OTP
- Role-based access control (admin, user, author)
- Admin features: list users, get user by ID, delete user, change user role
- User self-deletion
- Input validation (Joi & Mongoose)
- Centralized error handling
- Request logging

## 🛠️ Setup & Running
1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd PaperShelf-backEnd
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Create a `.env` file:** (see below for required variables)
4. **Start the server:**
   ```bash
   npm start
   ```

```

## 📚 API Overview

- **Auth:** Register, login, logout, email verification, password reset
- **User/Admin:** List users (admin), get user by ID (admin), update user info, delete user (admin), delete own account, change user role (admin)

For full API details, request/response examples, and error formats, **see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**.

## 🛡️ Roles & Access
- **User:** Register, login, update/delete own account
- **Admin:** All user management features
- **Author:** (future/optional)

## 🧪 Testing
- Use [Postman](https://www.postman.com/) or similar tools to test endpoints
- Protected routes require `Authorization: Bearer <accessToken>` header

## 📄 License
MIT
