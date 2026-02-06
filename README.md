# Eaton Call Center Frontend

A Next.js application for Eaton's call center operations, featuring module management, chat functionality, and user analytics..

## Overview

This application serves as a comprehensive platform for call center operations, enabling users to:
- Create and manage training modules
- Chat with an AI assistant to handle customer queries
- Track conversation history and performance analytics
- Manage user permissions and roles

## Features

### Dashboard
- Organization-level analytics with completion rates and module popularity
- User-specific activity metrics and performance tracking
- Profile management

### Module Management
- Create, edit, and delete training modules
- Upload and attach PDF documentation to modules
- Define evaluation criteria for each module
- Practice with modules through simulated customer interactions

### Chat System
- Real-time chat with AI assistant
- PDF document reference during conversations
- Criteria tracking and completion percentage
- Save and continue conversations

### User Administration
- Role-based access control (Admin, Manager, Trainee, Guest)
- User invitation and management
- Access level modification

### Chat History
- View and filter past conversations
- Review conversation details and performance metrics
- Continue or restart previous conversations

## Technology Stack

- **Framework**: Next.js with App Router
- **UI Components**: Material UI (MUI)
- **Styling**: Emotion with MUI theming system
- **Data Visualization**: MUI X-Charts
- **Data Grid**: MUI X-Data-Grid
- **Authentication**: JWT-based authentication
- **API Communication**: Axios

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd eaton-call-center-frontend-1
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_API_URL=<backend-api-url>
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (dashboard)/      # Dashboard pages (protected routes)
│   ├── auth/             # Authentication pages
│   ├── chat/             # Chat functionality
│   ├── components/       # Shared React components
│   └── mocks/            # Mock data for development
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── models/               # TypeScript interfaces and type definitions
├── services/             # API service functions
└── theme/                # MUI theme customization
```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow functional component patterns with React hooks
- Use MUI components and styling system for UI consistency

### State Management
- Use React Context for global state where appropriate
- Leverage Next.js App Router for routing state
- Use React hooks (useState, useEffect, useCallback) for component-level state

## Deployment

This application is designed to be deployed to standard Next.js hosting providers such as Vercel or Netlify.

### Build for Production
```bash
npm run build
# or
yarn build
```

## Authentication

The application uses JWT-based authentication. User roles include:
- **Admin** (access level 9): Full system access
- **Manager** (access level 5-8): Module management and user analytics
- **Trainee** (access level 1-4): Limited to chat and practice modules
- **Guest** (access level 0): Limited view-only access

## API Integration

The application communicates with a backend API for all data operations. The API endpoints are organized by resource type:
- `/chat` - Chat functionality endpoints
- `/user` - User management endpoints
- `/module` - Module management endpoints


## Support

For support, please contact the development team or refer to internal documentation.

# CWRU-study-buddy-frontend
