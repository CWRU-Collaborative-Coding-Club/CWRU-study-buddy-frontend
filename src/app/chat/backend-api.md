# Eaton Call Center Backend API Documentation

**Author:** Eaton Development Team  
**Date:** March 17, 2025

## Overview
This document provides a comprehensive guide to the Eaton Call Center Backend API, a FastAPI-based application that manages user authentication, training modules, and AI chat functionalities.

## Base URLs
- **Development:** `/dev`
- **Production:** `/prod`

## Authentication
Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Access Levels
- **Admin (9):** Full system access
- **Manager (5):** Training module management, user management
- **User (1):** Basic access to training modules
- **Deleted (0):** No access

## User Management API

### Sign Up
Register a new user in the system.
- **Endpoint:** `POST /user/signup`
- **Authentication:** Not required
- **Request Body:**
```json
{
    "email": "user@example.com",
    "password": "StrongPassword1!",
    "first_name": "John",
    "last_name": "Doe"
}
```
- **Response:** JWT token and success message

### Sign In
Authenticate an existing user.
- **Endpoint:** `POST /user/signin`
- **Authentication:** Not required
- **Request Body:**
```json
{
    "email": "user@example.com",
    "password": "StrongPassword1!"
}
```
- **Response:** JWT token and success message

### List Users
Retrieve a list of users with pagination and filtering options.
- **Endpoint:** `GET /user/list`
- **Authentication:** Required (User+)
- **Query Parameters:**
    - `filter_type`: “all” (default), “active”, or “deleted”
    - `search`: Search term to filter by email (optional)
    - `page`: Page number (default: 1)
    - `page_size`: Number of results per page (default: 10)
- **Response:** List of user objects

### Set User Access Level
Modify a user’s access level.
- **Endpoint:** `POST /user/set-access-level`
- **Authentication:** Required (Manager+)
- **Request Body:**
```json
{
    "email": "user@example.com",
    "new_access_level": 5
}
```
- **Response:** Success message

### Delete User
Soft delete a user from the system.
- **Endpoint:** `DELETE /user/{user_id}`
- **Authentication:** Required (Manager+)
- **Response:** Success message

## Manage Allowed Users

### Add Allowed Users
Add users to the allowed users list.
- **Endpoint:** `POST /user/allowed-users`
- **Authentication:** Required (Admin)
- **Request Body:**
```json
{
    "emails": "user1@example.com, user2@example.com",
    "access_level": 1
}
```
- **Response:** Success message

### List Allowed Users
Get a list of allowed users.
- **Endpoint:** `GET /user/allowed-users`
- **Authentication:** Required (Manager+)
- **Query Parameters:**
    - `search`: Search term to filter by email (optional)
    - `page`: Page number (default: 1)
    - `page_size`: Number of results per page (default: 10)
- **Response:** List of allowed user objects with pagination info

### Update Allowed User Access Level
Update an allowed user’s access level.
- **Endpoint:** `PUT /user/allowed-users/access-level`
- **Authentication:** Required (Admin)
- **Request Body:**
```json
{
    "email": "user@example.com",
    "new_access_level": 5
}
```
- **Response:** Success message

### Remove from Allowed Users
Delete a user from the allowed users list.
- **Endpoint:** `DELETE /user/allowed-users/{email}`
- **Authentication:** Required (Admin)
- **Response:** Success message

## Training Module API

### List Training Modules
Retrieve a paginated list of training modules with optional filtering.
- **Endpoint:** `GET /module/list`
- **Authentication:** Required (User+)
- **Query Parameters:**
    - `filter_deleted`: Include deleted modules (default: false)
    - `page`: Page number (default: 1)
    - `page_size`: Number of results per page (default: 10)
    - `search`: Search term to filter by title (optional)
- **Response:** List of training modules with pagination info

### Create Training Module
Create a new training module.
- **Endpoint:** `POST /module/create`
- **Authentication:** Required (Manager+)
- **Request Body:**
```json
{
    "title": "Customer Service Training",
    "system_prompt": "You are a customer service assistant..."
}
```
- **Response:** Created module information

### Edit Training Module
Update an existing training module.
- **Endpoint:** `PUT /module/{agent_id}`
- **Authentication:** Required (Manager+)
- **Request Body:**
```json
{
    "title": "Updated Training Title",
    "system_prompt": "Updated system prompt..."
}
```
- **Response:** Updated fields information

### Delete Training Module
Soft delete a training module.
- **Endpoint:** `DELETE /module/{agent_id}`
- **Authentication:** Required (Manager+)
- **Response:** Success message

## Chat API

### Stream Chat
Interact with AI models in a streaming format.
- **Endpoint:** `POST /stream_chat`
- **Authentication:** Required
- **Request Body:**
```json
{
    "messages": {
        "0": {"role": "user", "content": "Hello, how can I help?"}
    },
    "thread_id": "optional-thread-id",
    "provider": "openai"
}
```
- **Provider Options:**
    - “openai” or “openai-4-general” (GPT-4o)
    - “openai-35-fine-tune” (Fine-tuned GPT-3.5)
    - “openai-35-general” (GPT-4o Mini)
    - “anthropic” (Claude 3.5 Sonnet)
- **Response:** Streaming chat response

## Error Handling
All endpoints return appropriate HTTP status codes:
- **200:** Success
- **400:** Bad Request (validation errors)
- **401:** Unauthorized (missing or invalid token)
- **403:** Forbidden (insufficient permissions)
- **404:** Not Found
- **500:** Server Error

Error responses include a “detail” field with a description of the error.

## Environment Variables
Key environment variables required for operation:
- `JWT_SECRET_KEY`: Secret key for JWT token generation
- `OPENAI_API_KEY`: API key for OpenAI services
- `ANTHROPIC_API_KEY`: API key for Anthropic services
- Firebase configuration keys (for authentication and database)

## CORS Configuration
The API supports Cross-Origin Resource Sharing (CORS) for specified origins, including localhost development servers and production domains.
