# Team Inbox API Documentation

This folder contains the API documentation for the Team Inbox feature of the Just Ping multi-channel communication platform.

## Postman Collection

The `TeamInbox-Postman-Collection.json` file contains a Postman collection with all the API endpoints for the Team Inbox feature. You can import this file into Postman to test the API endpoints.

### Importing the Collection

1. Open Postman
2. Click on "Import" in the top left corner
3. Select the `TeamInbox-Postman-Collection.json` file
4. Click "Import"

### Importing the Environment

1. Open Postman
2. Click on the gear icon in the top right corner to open the "Manage Environments" modal
3. Click "Import" and select the `TeamInbox-Postman-Environment.json` file
4. Click "Import"
5. Close the modal

### Setting Up the Environment

Before using the collection, you need to set up the environment variables:

1. Click on the environment dropdown in the top right corner and select "Just Ping - Team Inbox API Environment"
2. Click on the eye icon to view the environment variables
3. Set the following variables:
   - `baseUrl`: The base URL of the API (e.g., `http://localhost:8083/api/v1`)
   - `authToken`: Your authentication token
   - `conversationId`: ID of a conversation you want to test with
   - `userId`: ID of a user you want to test with
   - `teamId`: ID of a team you want to test with
   - `tagId`: ID of a tag you want to test with
4. Click "Update"

## API Endpoints

The collection includes the following endpoints:

### Conversations

- **GET /team-inbox/conversations**: List conversations with filtering options
- **GET /team-inbox/conversations/{conversationId}**: Get conversation details with message history
- **PATCH /team-inbox/conversations/{conversationId}/status**: Update conversation status
- **PATCH /team-inbox/conversations/{conversationId}/assign**: Assign conversation to user or team
- **POST /team-inbox/conversations/{conversationId}/messages**: Send a message in a conversation
- **POST /team-inbox/conversations/{conversationId}/notes**: Send an internal note
- **GET /team-inbox/conversations/statistics**: Get conversation statistics

### Tags

- **GET /team-inbox/tags**: Get all tags
- **POST /team-inbox/tags**: Create a new tag
- **POST /team-inbox/conversations/{conversationId}/tags**: Add a tag to a conversation
- **DELETE /team-inbox/conversations/{conversationId}/tags/{tagId}**: Remove a tag from a conversation

## Authentication

All API endpoints require authentication using a JWT token. You need to set the `authToken` environment variable to your JWT token.

The token should be included in the `Authorization` header of each request:

```
Authorization: Bearer {{authToken}}
```

## Error Handling

The API uses standard HTTP status codes to indicate success or failure:

- **200 OK**: The request was successful
- **400 Bad Request**: The request was invalid
- **401 Unauthorized**: Authentication credentials are missing or invalid
- **403 Forbidden**: The authenticated user does not have permission to access the requested resource
- **404 Not Found**: The requested resource was not found
- **409 Conflict**: The request could not be completed due to a conflict with the current state of the resource
- **500 Internal Server Error**: An unexpected error occurred on the server

Error responses have the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {
      "field": "Error details for the field"
    }
  }
}
```

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)

Paginated responses include a `pagination` object with the following properties:

```json
{
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```
