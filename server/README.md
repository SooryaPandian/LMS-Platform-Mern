# College Connect Backend API

Backend server for the College Connect Learning Management System built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **JWT Authentication** with role-based access control
- **RESTful API** for all LMS entities
- **MongoDB** database with Mongoose ODM
- **File Upload** support for course materials
- **Pagination & Search** for all list endpoints
- **Role-based Authorization** (Admin, Faculty, Student, Parent)
- **Automatic Grade Calculation** for marks
- **Fee Payment Tracking** with status management

## Prerequisites

- Node.js 18+ and npm
- MongoDB 4.4+ (running locally or remote connection string)

## Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/college-connect
   JWT_SECRET=your-secret-key
   FRONTEND_URL=http://localhost:8080
   ```

4. **Start MongoDB:**
   
   If running locally:
   ```bash
   mongod
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

Server will start on `http://localhost:3000` with auto-reload on file changes.

### Production Mode
```bash
npm run build
npm start
```

### Seed Demo Data
```bash
npm run seed
```

This creates demo users and sample data for testing.

## Demo Credentials

After running the seed script, use these credentials:

- **Admin**: `admin@college.edu` / `admin123`
- **Faculty**: `faculty@college.edu` / `faculty123`
- **Student**: `student@college.edu` / `student123`
- **Parent**: `parent@college.edu` / `parent123`

## API Endpoints

All endpoints are prefixed with `/api`. Most endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Authentication
- `POST /api/auth/login` - Login with email/password, returns JWT token
- `GET /api/auth/profile` - Get current user profile (requires auth)

### Batches (Admin only for write)
- `GET /api/batches` - List all batches (with pagination)
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch

### Departments (Admin only for write)
- `GET /api/departments`
- `POST /api/departments`
- `PUT /api/departments/:id`
- `DELETE /api/departments/:id`

### Courses (Admin only for write)
- `GET /api/courses`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`

### Regulations (Admin only for write)
- `GET /api/regulations`
- `POST /api/regulations`
- `PUT /api/regulations/:id`
- `DELETE /api/regulations/:id`

### Classes (Admin only for write)
- `GET /api/classes`
- `POST /api/classes`
- `PUT /api/classes/:id`
- `DELETE /api/classes/:id`

### Faculty (Admin only for write)
- `GET /api/faculty`
- `POST /api/faculty`
- `PUT /api/faculty/:id`
- `DELETE /api/faculty/:id`

### Students (Admin only for write)
- `GET /api/students`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`

### Marks (Faculty & Admin can write)
- `GET /api/marks` - List all marks
- `POST /api/marks` - Create/update marks
- `GET /api/marks/student/:studentId` - Get marks for a student
- `GET /api/marks/class/:classId` - Get marks for a class

### Fees (Admin only for write)
- `GET /api/fees` - List fees
- `POST /api/fees` - Create fee structure
- `PUT /api/fees/:id` - Update fee
- `POST /api/fees/:id/payment` - Record payment
- `GET /api/fees/student/:studentId` - Get student fees

### Course Materials (Faculty & Admin can upload)
- `GET /api/materials` - List materials
- `POST /api/materials` - Upload material (multipart/form-data with 'file' field)
- `GET /api/materials/course/:courseId` - Get materials for a course
- `DELETE /api/materials/:id` - Delete material

### Query Parameters

List endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25)
- `search` - Search term (where applicable)

Example: `GET /api/courses?page=1&limit=10&search=database`

### File Upload

For file upload (course materials), use `multipart/form-data`:

```bash
curl -X POST http://localhost:3000/api/materials \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "courseId=<course-id>" \
  -F "title=Lecture Notes" \
  -F "visibility=public"
```

## Project Structure

```
server/
├── src/
│   ├── models/          # Mongoose models
│   ├── controllers/     # Route controllers
│   ├── routes/          # Express routes
│   ├── middleware/      # Auth, error handling
│   ├── utils/           # Seed data, utilities
│   ├── app.ts           # Express app setup
│   └── server.ts        # Entry point
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json
└── tsconfig.json
```

## Error Handling

The API returns errors in this format:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Testing with Frontend

1. Start the backend server (port 3000)
2. Start the frontend (port 8080)
3. Login via frontend UI
4. Navigate through different pages to test CRUD operations

## Notes

- All passwords are hashed using bcrypt before storage
- JWT tokens expire after 7 days
- File uploads are stored in the `./uploads` directory
- MongoDB indexes ensure unique emails, roll numbers, and course codes
- Marks are auto-graded based on total score

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

**Port Already in Use:**
- Change PORT in `.env` to another port

**CORS Issues:**
- Update FRONTEND_URL in `.env` to match your frontend URL

## License

This project is part of the College Connect LMS.
