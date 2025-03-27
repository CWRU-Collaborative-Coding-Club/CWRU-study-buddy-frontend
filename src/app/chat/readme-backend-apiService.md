# Backend API Implementation for Eaton Call Center Training Platform

## Overview

This document outlines the backend API requirements and implementation details for the Eaton Call Center Training Platform. It describes the necessary endpoints to support the frontend's `apiService.ts` functionality, including authentication, training modules, streaming chat, and progress tracking.

## API Structure

The API follows a RESTful pattern with the base URL:

```
https://eaton1-api.xlab-cwru.com
```

Endpoints use the `/dev` prefix for the development environment.

## Endpoints

### Authentication

#### Sign In

```
POST /dev/user/signin
```

**Purpose:** Authenticate a user and return a JWT token.

**Request:**
```json
{
    "email": "user@example.com",
    "password": "secure_password"
}
```

**Response:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "user123",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "access_level": 1
    }
}
```

**Frontend Usage:**
```typescript
// User signs in and receives token
ApiService.setAuthToken(response.token);
ApiService.setCurrentUser(response.user);
```

### Module Management

#### Get Module

```
GET /dev/module/{moduleId}
```

**Purpose:** Retrieve information about a training module.

**Query Parameters:**
- `user_id` (optional): ID of the current user to personalize content

**Response:**
```json
{
    "id": "module-123",
    "title": "Customer Billing Issue",
    "system_prompt": "This is a customer support training scenario...",
    "scenario_context": {
        "title": "Customer Billing Issue",
        "description": "Customer is confused about a $45 charge labeled 'Service Fee'...",
        "guidelines": [
            "Use empathetic language",
            "Offer clear explanations about billing policies",
            "Provide options for resolving the issue"
        ],
        "keyTerms": {
            "Service Fee": "Monthly fee for premium technical support ($45/month)",
            "Proration": "Partial billing for partial service period",
            "Service tier": "Level of support customer has subscribed to"
        }
    }
}
```

**Frontend Usage:**
```typescript
// Fetch module data when initializing chat
const moduleData = await ApiService.fetchModuleById(moduleId, userId);
setScenarioContext(moduleData.scenario_context);
```

#### Get Training Resources

```
GET /dev/resources/{moduleId}
```

**Purpose:** Retrieve training resources related to a module.

**Query Parameters:**
- `user_id` (optional): ID of the current user to personalize content

**Response:**
```json
[
    {
        "id": "1",
        "title": "Billing Policy Guide",
        "url": "/resources/billing-guide.pdf"
    },
    {
        "id": "2",
        "title": "Customer Service Standards",
        "url": "/resources/service-standards.pdf"
    }
]
```

**Frontend Usage:**
```typescript
// Fetch resources when "View Training Resources" is clicked
const resources = await ApiService.fetchTrainingResources(moduleId, userId);
```

### Chat Interface

#### Stream Chat

```
POST /dev/stream_chat
```

**Purpose:** Send user messages and receive streaming AI responses.

**Request Body:**
```json
{
    "messages": {
        "0": {
            "role": "assistant",
            "content": "Hello! I'm your virtual customer..."
        },
        "1": {
            "role": "user", 
            "content": "I understand your concern..."
        }
    },
    "thread_id": "thread-user123-module123-1710645893234",
    "user_id": "user123",
    "provider": "openai"
}
```

**Response Format:**
- Content-Type: `text/event-stream`
- Stream of text chunks
- Final chunk includes feedback data in format: `FEEDBACK_DATA:{"score":8,"comment":"Good response..."}`

**Frontend Usage:**
```typescript
// Send message and process streaming response
const controller = await ApiService.streamChat(
    formattedMessages,
    threadId,
    (chunk) => updateUIWithChunk(chunk),
    (feedback) => processFeedback(feedback),
    userId
);
```

### File Management

#### Upload Files

```
POST /dev/upload
```

**Purpose:** Upload files for attachment to messages.

**Request Format:**
- Content-Type: `multipart/form-data`
- Fields:
    - `files[]`: Array of file objects
    - `user_id` (optional): ID of uploading user

**Response:**
```json
{
    "urls": [
        "https://storage.example.com/uploads/1710645893234-document.pdf",
        "https://storage.example.com/uploads/1710645893235-image.jpg"
    ]
}
```

**Frontend Usage:**
```typescript
// Upload files and get URLs
const attachmentUrls = await ApiService.uploadAttachments(files, userId);
```

### Progress Tracking

#### Record Progress

```
POST /dev/training/progress
```

**Purpose:** Record a user's progress in a training module.

**Request Body:**
```json
{
    "user_id": "user123",
    "module_id": "module-123",
    "thread_id": "thread-user123-module123-1710645893234",
    "score": 8
}
```

**Response:**
```json
{
    "success": true,
    "progress": {
        "user_id": "user123",
        "module_id": "module-123",
        "attempts": 2,
        "best_score": 8,
        "completed": true
    }
}
```

**Frontend Usage:**
```typescript
// Record user's progress after receiving feedback
await ApiService.trackProgress(userId, moduleId, threadId, feedbackScore);
```

#### Get User Progress

```
GET /dev/training/progress/{userId}
```

**Purpose:** Retrieve a user's progress across all training modules.

**Response:**
```json
{
    "total_modules": 5,
    "completed_modules": 2,
    "average_score": 7.5,
    "modules": [
        {
            "module_id": "module-123",
            "title": "Customer Billing Issue",
            "completed": true,
            "best_score": 8,
            "attempts": 2
        },
        {
            "module_id": "module-456",
            "title": "Technical Support Basics",
            "completed": true,
            "best_score": 7,
            "attempts": 1
        }
    ]
}
```

**Frontend Usage:**
```typescript
// Get progress for displaying on user dashboard
const userProgress = await ApiService.getUserProgress(userId);
```

## Data Models

### User Model
```typescript
interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    access_level: number; // 9=admin, 5=manager, 1=user, 0=deleted
}
```

### Module Model
```typescript
interface ModuleResponse {
    id: string;
    title: string;
    system_prompt: string;
    scenario_context: {
        title: string;
        description: string;
        guidelines: string[];
        keyTerms: {[key: string]: string};
    };
}
```

### Training Resource Model
```typescript
interface TrainingResource {
    id: string;
    title: string;
    url: string;
}
```

### Progress Model
```typescript
interface Progress {
    user_id: string;
    module_id: string;
    attempts: number;
    best_score: number;
    completed: boolean;
    last_attempt_date?: string;
}
```

## Implementation Notes

### Authentication Flow

1. JWT tokens are used for authentication
2. Tokens are stored in localStorage by the frontend
3. Each API request includes the token in the Authorization header
4. The backend should validate tokens and check user access levels

### Stream Response Implementation

The streaming implementation requires special attention:

1. Use a text/event-stream content type
2. Ensure chunks are properly flushed to the client
3. Format feedback data with the prefix `FEEDBACK_DATA:` followed by JSON
4. Handle client disconnections gracefully

### ID Management

Three key identifiers are used throughout the system:

1. **User ID:** Identifies the agent/trainee (from authentication)
2. **Module ID:** Identifies the specific training scenario
3. **Thread ID:** Uniquely identifies a conversation session (generated as `thread-{userId}-{moduleId}-{timestamp}`)

### Progress Tracking

The progress tracking system should:

1. Record each training attempt
2. Track the highest score achieved
3. Mark modules as completed based on score thresholds
4. Calculate overall progress statistics

## ApiService.ts Implementation

The frontend `apiService.ts` file provides a comprehensive client-side API layer that:

1. Manages authentication tokens and user data
2. Handles API requests with proper headers and error handling
3. Processes streaming responses for real-time chat interactions
4. Includes fallback mechanisms for when backend services are unavailable
5. Provides mock implementations for endpoints not yet available

The most critical method is `streamChat`, which handles the streaming text response from the LLM:

```typescript
streamChat: async (
    messages: {[key: string]: {role: string, content: string}}, 
    threadId: string,
    onChunk: (chunk: string) => void,
    onComplete: (feedback?: any) => void,
    userId?: string
) => {
    let controller: AbortController | null = new AbortController();
    
    try {
        // Build request body - include user_id if available
        const requestBody: any = {
            messages,
            thread_id: threadId,
            provider: "openai"
        };
        
        if (userId) {
            requestBody.user_id = userId;
        }
        
        const response = await fetch(`${BASE_URL}/dev/stream_chat`, {
            method: "POST",
            headers: ApiService.getHeaders(),
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        
        // Process streaming response...
        // Implementation handles chunks and extracts feedback data
    }
}
```

## Conclusion

This document outlines the backend API requirements needed to support the frontend `apiService.ts` functionality. By implementing these endpoints, the backend will provide all necessary data and processing for the customer service training chat interface.

The clear separation between frontend and backend responsibilities allows for:

1. Independent development of each component
2. Graceful degradation when services are unavailable
3. Future extensibility to support additional training features
4. Proper user progress tracking and analytics
