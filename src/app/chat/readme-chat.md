# Call Center Training Chat Interface

**Author:** Eaton Development Team  
**Date:** \today

## Overview

This document provides a comprehensive guide to the Call Center Training Chat Interface, a React-based application for training customer service representatives through simulated customer interactions. The application uses a streaming chat API to provide realistic customer service scenarios with performance feedback.

## Files

The application consists of two main files:

- `page.tsx` - The main React component that renders the chat interface
- `apiService.ts` - Service layer that handles all API communications

## Technical Architecture

### Frontend Framework

- Next.js with React
- TypeScript for type safety
- Material UI for UI components

### Backend Integration

- RESTful API integration via Fetch API
- Streaming response handling
- JWT authentication
- User session tracking

## Identity Management

The application manages three key identifiers:

1. **User ID**: Identifies the agent/trainee
    - Retrieved from authentication context or stored user data
    - Used for tracking progress and personalizing content
    - Falls back to "anonymous-user" when no authentication is present

2. **Module ID**: Identifies the training scenario
    - Retrieved from URL parameters or query string
    - Determines which scenario context and resources to load
    - Falls back to "module-123" if not provided

3. **Thread ID**: Identifies a specific training conversation
    - Generated using `generateThreadId(userId, moduleId)`
    - Format: `thread-{userId}-{moduleId}-{timestamp}`
    - Ensures each training session is uniquely tracked

## Component: Chat Interface (`page.tsx`)

### Features

- **Real-time Chat** - Simulated customer conversations
- **Streaming Responses** - Realistic typing effect for virtual customer
- **File Attachments** - Support for adding files and images to messages
- **Performance Feedback** - Score and comments on agent responses
- **Training Guidelines** - Contextual information about the scenario
- **Training Resources** - Additional learning materials
- **Progress Tracking** - Session-based performance metrics
- **User Recognition** - Personalized interface based on user data

### State Management

The chat interface uses React hooks for state management:

- `messages`: Array of chat messages between user and virtual customer
- `inputMessage`: Current text in the input field
- `isTyping`: Indicates if the virtual customer is "typing"
- `attachments`: Files selected for upload
- `threadId`: Unique ID for the current conversation
- `moduleId`: ID of the current training module
- `userId`: ID of the current user or "anonymous-user"
- `scenarioContext`: Training scenario details
- `resources`: Training resources related to the scenario
- `progressTracked`: Flag to prevent duplicate progress tracking

### Key Functions

- `initializeChat()`: Loads the training module and scenario context
- `handleSendMessage()`: Processes user messages and initiates API responses
- `handleChunk()`: Processes streamed response chunks
- `handleComplete()`: Finalizes responses, adds feedback, and tracks progress
- `trackProgress()`: Records user performance metrics to the backend

### UI Components

#### User Information Section

- Shows user avatar with initials
- Displays full name if available
- Shows training session ID
- Conditionally shows progress tracking options

#### Scenario Context Sidebar

- Shows scenario title, description
- Lists guidelines for the conversation
- Displays key terms with definitions
- Provides access to training resources

#### Chat Area

- Message history with different styling for user and AI
- Typing indicators
- Automatic scrolling to new messages
- Feedback chips on user messages
- Detailed feedback comments

#### Input Area

- Multi-line text input
- File attachment options
- Attachment previews

## Service Layer (`apiService.ts`)

The API service handles all communication with the backend.

### Configuration

- **Base URL**: `https://eaton1-api.xlab-cwru.com`
- Authentication via JWT tokens stored in `localStorage`

### Methods

#### Authentication & User Management

- `getAuthToken()`: Retrieves JWT from localStorage
- `setAuthToken(token)`: Stores JWT in localStorage
- `getCurrentUser()`: Retrieves current user information
- `setCurrentUser(user)`: Stores current user information
- `getHeaders(contentType)`: Constructs request headers with authentication

#### Identity Management

- `generateThreadId(userId, moduleId)`: Creates unique thread IDs

#### Data Fetching

- `fetchModuleById(moduleId, userId)`: Gets training module details
- `fetchTrainingResources(moduleId, userId)`: Gets related training materials

#### Chat Functionality

- `streamChat(messages, threadId, onChunk, onComplete, userId)`: Handles streaming chat responses
  - `messages`: Formatted message history
  - `threadId`: Conversation identifier
  - `onChunk`: Callback for processing response chunks
  - `onComplete`: Callback for handling response completion
  - `userId`: User identifier for tracking progress

#### File Handling

- `uploadAttachments(files, userId)`: Uploads file attachments and returns URLs

#### Progress Tracking

- `trackProgress(userId, moduleId, threadId, score)`: Records training performance
- `getUserProgress(userId)`: Retrieves a user's training history

#### Error Handling

The service provides fallback data and graceful error handling for API failures, ensuring the application remains functional even when backend services are unavailable.

### API Endpoints Used

- **GET** `/dev/module/{moduleId}`: Retrieves training module data
  - Optional query param: `user_id` for personalization

- **POST** `/dev/stream_chat`: Sends user messages and receives streaming AI responses
  - Requires message history in indexed object format
  - Includes `thread_id` and optional `user_id`
  - Returns streamed response chunks
  - Feedback data format: `FEEDBACK_DATA:{"score":8,"comment":"..."}`

- **POST** `/dev/upload`: Uploads file attachments (mock implementation)
  - Uses FormData with `files[]` and optional `user_id`
  - Returns URLs to uploaded files

- **POST** `/dev/training/progress`: Tracks user progress (mock implementation)
  - Records `user_id`, `module_id`, `thread_id`, and `score`

- **GET** `/dev/training/progress/{userId}`: Retrieves user progress (mock implementation)
  - Returns summary of completed modules and scores

## Extending the Application

### Adding New Training Scenarios

1. Create new training modules in the backend
2. Access them by changing the `moduleId` parameter in the URL

### Custom Feedback Mechanisms

The feedback system can be enhanced by:

- Adding more detailed rubrics
- Implementing real-time guidance
- Adding post-conversation summaries

### Authentication Integration

For production use, integrate with your authentication provider:

1. Replace the token storage mechanism in `getAuthToken()` and `setCurrentUser()`
2. Add login/logout functionality
3. Implement role-based access control

### Progress Reporting

The current implementation tracks progress but could be extended with:

- Detailed analytics dashboard
- Progress comparison between users
- Trend analysis over time

## Troubleshooting

### Common Issues

- **API Connection Failures**: Check network connectivity and API status
- **Missing Messages**: Ensure proper thread ID handling
- **Streaming Issues**: Verify browser compatibility with ReadableStream API
- **User Recognition Issues**: Check if user data is properly stored in localStorage

### Debugging

The application includes comprehensive error logging. Check the browser console for detailed error messages when issues occur.

## Conclusion

The Call Center Training Chat Interface provides a robust platform for training customer service representatives. Its modular architecture allows for easy extension and customization to meet specific training requirements, while the identity management system ensures proper tracking and personalization.
