# Math Quiz Backend

A Node.js/Express backend API for a math quiz application with authentication and problem tracking.

## Features

- User authentication (signup/signin) with JWT tokens
- Password hashing with bcrypt
- PostgreSQL database with Neon
- Problem solving progress tracking
- Protected routes with JWT middleware

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT, bcrypt
- **Environment**: dotenv

## API Routes

### Authentication Routes
- `POST /auth/signup` - Create new user account
- `POST /auth/signin` - User login
- `GET /auth/profile` - Get user profile (protected)

### Problems Routes
- `POST /problems/solve` - Mark problem as solved (protected)
- `GET /problems/solved` - Get user's solved problems (protected)
- `GET /problems/stats` - Get user statistics (protected)
- `POST /problems/remove` - Remove problem from solved list (protected)

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/math-quiz-backend.git
cd math-quiz-backend
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
```env
DATABASE_URL=your_neon_postgresql_connection_string
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

4. Run the server
```bash
node index.js
```

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  about TEXT,
  solved_problems INTEGER[] DEFAULT '{}'
);
```

## Usage Examples

### Sign Up
```bash
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "about": "Math enthusiast"
}
```

### Mark Problem as Solved
```bash
POST /problems/solve
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
  "problemId": 101
}
```

## Dependencies

- express
- cors
- bcrypt
- jsonwebtoken
- pg (PostgreSQL client)
- dotenv

