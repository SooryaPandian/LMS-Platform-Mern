# College LMS - Learning Management System

A comprehensive, role-based Learning Management System built with React, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- **Role-Based Access Control**: Four distinct user roles (Admin, Faculty, Student, Parent)
- **Batch Management**: Organize students by academic batches and passing years
- **Department Management**: Manage academic departments and their structures
- **Course Catalog**: Comprehensive course management with credits, categories, and descriptions
- **Regulation Management**: Define curriculum regulations and map courses to semesters
- **Class Management**: Create and manage class offerings with faculty assignments
- **Student Marks**: Track and manage student performance across assessments
- **Fee Management**: Monitor fee structures, payments, and outstanding balances
- **Course Materials**: Upload and share learning materials with visibility controls
- **CSV/Excel Bulk Upload**: Import data in bulk for efficient management

### User Roles & Permissions

#### Admin
- Full access to all management features
- Create and manage batches, departments, courses, regulations, and classes
- Assign faculty to classes and designate advisors
- Manage student enrollments and fee structures
- Bulk upload via CSV/Excel
- View comprehensive analytics and reports

#### Faculty
- View assigned classes and student rosters
- Upload course materials (publicly visible for courses)
- Enter and manage marks for students in their classes
- Access advisor panel (if assigned as advisor)
- View student fee details (read-only)

#### Student
- View personal academic records and marks
- Access course materials for enrolled classes
- Track fee payment status and history
- View semester progress and attendance

#### Parent
- Monitor child's academic performance
- View marks, course materials, and fee status
- Receive notifications about academic updates
- Access read-only student information

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context + hooks
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens
- **Forms**: React Hook Form with validation
- **Data Fetching**: TanStack Query (React Query)
- **Notifications**: Sonner for toast notifications
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/
│   ├── layout/           # Layout components (AppLayout, RoleGuard)
│   └── ui/               # Reusable UI components (shadcn/ui)
├── contexts/             # React contexts (AuthContext)
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API client
├── pages/                # Page components organized by role
│   ├── admin/            # Admin pages
│   ├── faculty/          # Faculty pages
│   ├── student/          # Student pages
│   └── parent/           # Parent pages
├── types/                # TypeScript type definitions
└── App.tsx               # Main app component with routing
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm installed
- Backend API server running (see API documentation)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd college-lms
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Demo Credentials

For testing purposes, use these credentials:

- **Admin**: admin@college.edu / admin123
- **Faculty**: faculty@college.edu / faculty123
- **Student**: student@college.edu / student123
- **Parent**: parent@college.edu / parent123

## API Integration

The frontend expects a REST API with the following endpoints:

### Authentication
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile

### Core Entities
- `/batches` - Batch CRUD operations
- `/departments` - Department CRUD operations
- `/courses` - Course CRUD operations
- `/regulations` - Regulation CRUD operations
- `/classes` - Class CRUD operations
- `/faculty` - Faculty management
- `/students` - Student management
- `/marks` - Marks management
- `/fees` - Fee management
- `/materials` - Course materials

All list endpoints support pagination with `?page=1&limit=25&search=...`

## Features to be Implemented

The following features are planned for future releases:

- [ ] Regulation management UI
- [ ] Complete class management with faculty assignment
- [ ] Marks entry and CSV import
- [ ] Fee payment recording
- [ ] Course materials upload
- [ ] Bulk CSV/Excel upload page
- [ ] Faculty advisor assignment workflow
- [ ] Advanced filtering and search
- [ ] Activity logs and audit trail
- [ ] Email notifications
- [ ] Mobile responsive enhancements
- [ ] Offline support
- [ ] Export to PDF/Excel

## Design System

The app uses a comprehensive design system with:
- Semantic color tokens for light/dark mode support
- Consistent spacing and typography
- Accessible components following WCAG guidelines
- Responsive layouts for mobile, tablet, and desktop

## Development Guidelines

### Adding New Pages
1. Create page component in appropriate role folder
2. Add route in `App.tsx` with `RoleGuard`
3. Update navigation in `AppLayout.tsx`
4. Add API endpoints in `lib/api.ts`

### State Management
- Use React Context for global state (auth, theme)
- Use TanStack Query for server state
- Use local state for component-specific data

### Styling
- Use Tailwind utility classes
- Reference design tokens from `index.css`
- Never use direct colors (e.g., `text-white`, `bg-black`)
- Create component variants when needed

## Building for Production

```bash
npm run build
```

The optimized build will be in the `dist` directory.

## License

This project is part of a college management system.

## Support

For issues and questions, please contact the development team.
