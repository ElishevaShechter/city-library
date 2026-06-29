# City Library — REST API Documentation

Base URL (local): `http://localhost:5000`

---

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from `/api/auth/signup` or `/api/auth/login` and expire after **7 days**.

---

## Auth Endpoints

### POST /api/auth/signup

Register a new user.

**Headers:** none

**Body:**
```json
{
  "name": "Elisheva",
  "email": "eli@example.com",
  "password": "mypassword"
}
```

**Response 201:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "64abc123...",
    "name": "Elisheva",
    "email": "eli@example.com",
    "role": "user"
  }
}
```

**Errors:** `400` email already in use

---

### POST /api/auth/login

Login with existing credentials.

**Headers:** none

**Body:**
```json
{
  "email": "eli@example.com",
  "password": "mypassword"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "64abc123...",
    "name": "Elisheva",
    "email": "eli@example.com",
    "role": "user"
  }
}
```

**Errors:** `401` invalid email or password

---

## Books Endpoints

### GET /api/books

Get all books. Supports optional query params for search and filtering.

**Headers:** none

**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by title or author (case-insensitive) |
| `category` | string | Filter by category ObjectId |

**Examples:**
```
GET /api/books
GET /api/books?search=harry
GET /api/books?category=64abc123...
GET /api/books?search=rowling&category=64abc123...
```

**Response 200:**
```json
[
  {
    "_id": "64abc123...",
    "title": "Harry Potter",
    "author": "J.K. Rowling",
    "category": { "_id": "64def456...", "name": "Fiction" },
    "description": "...",
    "publishedYear": 1997,
    "coverImage": "https://...",
    "totalCopies": 3,
    "availableCopies": 2,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET /api/books/:id

Get a single book by ID.

**Headers:** none

**Response 200:** single book object (same structure as above)

**Errors:** `404` book not found

---

### POST /api/books _(admin only)_

Add a new book.

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "title": "Harry Potter",
  "author": "J.K. Rowling",
  "category": "64def456...",
  "description": "A young wizard's journey",
  "publishedYear": 1997,
  "coverImage": "https://example.com/cover.jpg",
  "totalCopies": 3
}
```

> `availableCopies` is set automatically equal to `totalCopies`.

**Response 201:** created book object

**Errors:** `401` not authorized · `403` admins only

---

### PATCH /api/books/:id _(admin only)_

Update any field of an existing book.

**Headers:** `Authorization: Bearer <admin_token>`

**Body:** any subset of book fields
```json
{
  "availableCopies": 5,
  "description": "Updated description"
}
```

**Response 200:** updated book object

**Errors:** `401` · `403` · `404` book not found

---

### DELETE /api/books/:id _(admin only)_

Delete a book.

**Headers:** `Authorization: Bearer <admin_token>`

**Response 200:**
```json
{ "message": "Book deleted" }
```

**Errors:** `401` · `403` · `404` book not found

---

## Categories Endpoints

### GET /api/categories

Get all categories.

**Headers:** none

**Response 200:**
```json
[
  { "_id": "64def456...", "name": "Fiction" },
  { "_id": "64def789...", "name": "Science" }
]
```

---

### POST /api/categories _(admin only)_

Add a new category.

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{ "name": "Fiction" }
```

**Response 201:**
```json
{ "_id": "64def456...", "name": "Fiction" }
```

**Errors:** `400` category already exists · `401` · `403`

---

## Loans Endpoints

### POST /api/loans

Borrow a book. Sets `dueDate` to 14 days from today.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{ "bookId": "64abc123..." }
```

**Response 201:**
```json
{
  "_id": "64xyz789...",
  "user": "64user...",
  "book": { "_id": "64abc123...", "title": "Harry Potter", "author": "J.K. Rowling" },
  "loanDate": "2024-01-01T00:00:00.000Z",
  "dueDate": "2024-01-15T00:00:00.000Z",
  "returnDate": null,
  "status": "active"
}
```

**Errors:** `400` no available copies · `400` already on loan · `404` book not found · `401`

---

### GET /api/loans/my

Get the logged-in user's loans.

**Headers:** `Authorization: Bearer <token>`

**Response 200:** array of loan objects (sorted newest first)

---

### GET /api/loans _(admin only)_

Get all loans across all users.

**Headers:** `Authorization: Bearer <admin_token>`

**Response 200:** array of loan objects including `user.name` and `user.email`

---

### PATCH /api/loans/:id/return

Return a borrowed book. Updates `status` to `returned` and sets `returnDate`.

**Headers:** `Authorization: Bearer <token>`

**Response 200:** updated loan object

**Errors:** `400` already returned · `403` not your loan · `404` loan not found · `401`

---

## Error Response Format

All errors return:
```json
{ "message": "Description of the error" }
```

## Status Codes Summary

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 500 | Server Error |
