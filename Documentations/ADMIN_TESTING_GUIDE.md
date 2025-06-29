# Admin Book Management Testing Guide

## Overview
This guide helps you test the admin book management features using Postman. You'll need to be authenticated as an admin user to access these endpoints.

## Prerequisites
1. **Admin Account**: You need to register/login as an admin user
2. **Authentication Token**: Get your Bearer token from login
3. **Postman**: For testing the API endpoints

## Step 1: Authentication
First, you need to authenticate as an admin user.

### Register Admin User (if needed)
```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

### Login to Get Token
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

**Save the `accessToken` from the response for use in subsequent requests.**

## Step 2: Test Admin Book Management

### 1. Create a Book with File Upload

**Method**: `POST`
**URL**: `http://localhost:3000/api/v1/books`
**Headers**:
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Body**: `form-data`
- `coverImage`: [Select file] (JPEG, PNG, or WebP, max 5MB)
- `title`: "The Great Gatsby"
- `author`: "F. Scott Fitzgerald"
- `description`: "A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan."
- `price`: 19.99
- `category`: "Fiction"
- `stock`: 50
- `pages`: 180
- `discount`: 10

### 2. Create a Book with URL (Alternative)

**Method**: `POST`
**URL**: `http://localhost:3000/api/v1/books`
**Headers**:
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
- `Content-Type`: `application/json`

**Body**:
```json
{
  "title": "To Kill a Mockingbird",
  "author": "Harper Lee",
  "description": "The story of young Scout Finch and her father Atticus in a racially divided Alabama town.",
  "coverImageUrl": "https://example.com/mockingbird-cover.jpg",
  "price": 24.99,
  "category": "Fiction",
  "stock": 30,
  "pages": 281,
  "discount": 0
}
```

### 3. Get All Books (Public)

**Method**: `GET`
**URL**: `http://localhost:3000/api/v1/books`
**No authentication required**

**Query Parameters** (optional):
- `page`: 1
- `limit`: 20
- `sort`: title (or price, rating, createdAt)
- `order`: asc (or desc)
- `category`: Fiction
- `minPrice`: 10
- `maxPrice`: 50
- `rating`: 4
- `inStock`: true

### 4. Get Book by ID

**Method**: `GET`
**URL**: `http://localhost:3000/api/v1/books/BOOK_ID`
**No authentication required**

### 5. Update a Book

**Method**: `PUT`
**URL**: `http://localhost:3000/api/v1/books/BOOK_ID`
**Headers**:
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**Body**: `form-data` (for file upload) or `application/json` (for URL)
- `title`: "Updated Book Title"
- `price`: 29.99
- `stock`: 25
- `coverImage`: [Select new file] (optional)

### 6. Toggle Featured Status

**Method**: `PATCH`
**URL**: `http://localhost:3000/api/v1/books/BOOK_ID/featured`
**Headers**:
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

**No body required** - this toggles the featured status

### 7. Get Featured Books (Public)

**Method**: `GET`
**URL**: `http://localhost:3000/api/v1/books/featured`
**No authentication required**

**Query Parameters** (optional):
- `limit`: 10

### 8. Delete a Book

**Method**: `DELETE`
**URL**: `http://localhost:3000/api/v1/books/BOOK_ID`
**Headers**:
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`

## Step 3: Test Public Shop Features

### Search Books
**Method**: `GET`
**URL**: `http://localhost:3000/api/v1/books/search?q=gatsby`
**No authentication required**

**Query Parameters**:
- `q`: Search query (required)
- `page`: 1
- `limit`: 20
- `searchIn`: title,author,description

### Get Categories
**Method**: `GET`
**URL**: `http://localhost:3000/api/v1/books/categories`
**No authentication required**

## Sample Book Data for Testing

Here are some sample books you can create for testing:

### Sample 1: Fiction
```json
{
  "title": "1984",
  "author": "George Orwell",
  "description": "A dystopian novel about totalitarianism and surveillance society.",
  "coverImageUrl": "https://example.com/1984-cover.jpg",
  "price": 15.99,
  "category": "Fiction",
  "stock": 40,
  "pages": 328,
  "discount": 15
}
```

### Sample 2: Science Fiction
```json
{
  "title": "Dune",
  "author": "Frank Herbert",
  "description": "A science fiction novel set on the desert planet Arrakis.",
  "coverImageUrl": "https://example.com/dune-cover.jpg",
  "price": 22.99,
  "category": "Science Fiction",
  "stock": 35,
  "pages": 688,
  "discount": 0
}
```

### Sample 3: Mystery
```json
{
  "title": "The Hound of the Baskervilles",
  "author": "Arthur Conan Doyle",
  "description": "A Sherlock Holmes mystery novel.",
  "coverImageUrl": "https://example.com/hound-cover.jpg",
  "price": 12.99,
  "category": "Mystery",
  "stock": 60,
  "pages": 256,
  "discount": 20
}
```

## Testing Checklist

### Admin Features
- [ ] Create book with file upload
- [ ] Create book with URL
- [ ] Update book information
- [ ] Update book with new image
- [ ] Toggle featured status
- [ ] Delete book
- [ ] Verify file cleanup after deletion

### Public Features
- [ ] Get all books with pagination
- [ ] Filter books by category
- [ ] Filter books by price range
- [ ] Sort books by different criteria
- [ ] Search books by title/author
- [ ] Get featured books
- [ ] Get book categories
- [ ] Get individual book details

### Error Handling
- [ ] Try to access admin endpoints without authentication
- [ ] Try to access admin endpoints with non-admin user
- [ ] Upload invalid file types
- [ ] Upload files larger than 5MB
- [ ] Create book without required fields

## Expected Responses

### Successful Book Creation
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "book": {
      "_id": "...",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "coverImage": "http://localhost:3000/uploads/book-covers/book-cover-1234567890-123456789.jpg",
      "price": 19.99,
      "category": "Fiction",
      "stock": 50,
      "isFeatured": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Successful Featured Toggle
```json
{
  "success": true,
  "message": "Book added to featured list",
  "data": {
    "book": {
      "_id": "...",
      "title": "The Great Gatsby",
      "isFeatured": true
    }
  }
}
```

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check your Bearer token
2. **403 Forbidden**: Ensure your user has admin role
3. **400 Bad Request**: Check required fields and file types
4. **413 Payload Too Large**: File size exceeds 5MB limit

### File Upload Issues
- Ensure you're using `form-data` for file uploads
- Check file type (JPEG, PNG, WebP only)
- Verify file size (max 5MB)
- Make sure the `uploads/book-covers` directory exists

### Database Issues
- Check MongoDB connection
- Verify book schema validation
- Check for duplicate entries if using unique fields 