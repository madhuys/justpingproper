# Just Ping API Documentation - Team Inbox

## Overview

This document outlines the API endpoints for the Team Inbox feature of the Just Ping multi-channel communication platform. The Team Inbox allows business users to view, manage, and respond to customer conversations across various channels in a centralized interface.

## Base URL

```
https://api.justping.com/v1
```

## Authentication

All Team Inbox API endpoints require authentication using a valid JWT token:

```
Authorization: Bearer <your-token>
```

Access to Team Inbox endpoints is controlled through role-based permissions:

- Super Admin and Admin roles have full access
- Executive roles can view and update conversations
- Viewer roles have read-only access and cannot change conversation status

## Conversation Management

### 1. List Conversations

Retrieve a list of conversations with filtering options.

#### Request

```http
GET /conversations
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

#### Query Parameters

| Parameter      | Type   | Description                                                  |
| -------------- | ------ | ------------------------------------------------------------ |
| status         | string | Filter by conversation status: 'active', 'pending', 'closed' |
| campaign_id    | UUID   | Filter by campaign ID                                        |
| broadcast_id   | UUID   | Filter by broadcast ID                                       |
| search         | string | Search by contact name, phone, or message content            |
| timeframe      | string | Filter by time period: '24h', '7d', '30d'                    |
| assigned_to    | UUID   | Filter by assigned user ID                                   |
| assigned_team  | UUID   | Filter by assigned team ID                                   |
| page           | number | Page number for pagination (default: 1)                      |
| limit          | number | Number of items per page (default: 20)                       |
| sort_by        | string | Field to sort by (default: 'last_message_at')                |
| sort_direction | string | Sort direction: 'asc' or 'desc' (default: 'desc')            |

#### Response

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "business_id": "550e8400-e29b-41d4-a716-446655440000",
        "end_user": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "first_name": "John",
          "last_name": "Doe",
          "phone": "+919876543210",
          "email": "john.doe@example.com"
        },
        "channel": {
          "id": "550e8400-e29b-41d4-a716-446655440003",
          "name": "whatsapp"
        },
        "type": "support",
        "status": "active",
        "priority": "medium",
        "category": "sales",
        "assigned_user": {
          "id": "550e8400-e29b-41d4-a716-446655440004",
          "first_name": "Jane",
          "last_name": "Smith"
        },
        "assigned_team": {
          "id": "550e8400-e29b-41d4-a716-446655440005",
          "name": "Sales Team"
        },
        "tags": ["new-lead", "follow-up"],
        "last_message": {
          "id": "550e8400-e29b-41d4-a716-446655440006",
          "sender_type": "end_user",
          "content": "I'm interested in your enterprise plan",
          "content_type": "text",
          "created_at": "2025-05-01T14:30:00Z"
        },
        "unread_count": 2,
        "created_at": "2025-05-01T10:00:00Z",
        "updated_at": "2025-05-01T14:30:00Z",
        "last_message_at": "2025-05-01T14:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

### 2. Get Conversation Details with Message History

Retrieve detailed information about a conversation, including message history.

#### Request

```http
GET /conversations/{conversationId}
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

#### Path Parameters

| Parameter      | Type | Description                |
| -------------- | ---- | -------------------------- |
| conversationId | UUID | The ID of the conversation |

#### Query Parameters

| Parameter | Type   | Description                                     |
| --------- | ------ | ----------------------------------------------- |
| page      | number | Page number for message pagination (default: 1) |
| limit     | number | Number of messages per page (default: 50)       |

#### Response

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "business_id": "550e8400-e29b-41d4-a716-446655440000",
      "end_user": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+919876543210",
        "email": "john.doe@example.com",
        "country_code": "IN"
      },
      "channel": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "whatsapp"
      },
      "type": "support",
      "status": "active",
      "priority": "medium",
      "category": "sales",
      "assigned_user": {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane.smith@company.example.com"
      },
      "assigned_team": {
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "name": "Sales Team"
      },
      "broadcast": {
        "id": "550e8400-e29b-41d4-a716-446655440007",
        "name": "May Promotion",
        "campaign_id": "550e8400-e29b-41d4-a716-446655440008",
        "campaign_name": "Summer Offers"
      },
      "tags": ["new-lead", "follow-up"],
      "created_at": "2025-05-01T10:00:00Z",
      "updated_at": "2025-05-01T14:30:00Z",
      "last_message_at": "2025-05-01T14:30:00Z",
      "first_response_at": "2025-05-01T10:05:00Z",
      "resolved_at": null,
      "closed_at": null,
      "messages": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440009",
          "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
          "sender_type": "business",
          "sender_id": "550e8400-e29b-41d4-a716-446655440000",
          "content": "Hello! Check out our new enterprise plans with exclusive discounts.",
          "content_type": "text",
          "is_internal": false,
          "created_at": "2025-05-01T10:00:00Z",
          "delivered_at": "2025-05-01T10:00:05Z",
          "read_at": "2025-05-01T10:15:00Z",
          "attachments": []
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440010",
          "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
          "sender_type": "end_user",
          "sender_id": "550e8400-e29b-41d4-a716-446655440002",
          "content": "I'm interested in your enterprise plan. Can you provide more details?",
          "content_type": "text",
          "is_internal": false,
          "created_at": "2025-05-01T10:20:00Z",
          "delivered_at": "2025-05-01T10:20:01Z",
          "read_at": "2025-05-01T10:22:00Z",
          "attachments": []
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440011",
          "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
          "sender_type": "business_user",
          "sender_id": "550e8400-e29b-41d4-a716-446655440004",
          "content": "This looks like a promising lead. Let's follow up with a call.",
          "content_type": "text",
          "is_internal": true,
          "created_at": "2025-05-01T10:25:00Z",
          "attachments": []
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440012",
          "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
          "sender_type": "business_user",
          "sender_id": "550e8400-e29b-41d4-a716-446655440004",
          "content": "Sure! Our enterprise plan includes unlimited messages, 24/7 support, and integration with your CRM. Would you like to schedule a demo?",
          "content_type": "text",
          "is_internal": false,
          "created_at": "2025-05-01T10:30:00Z",
          "delivered_at": "2025-05-01T10:30:02Z",
          "read_at": "2025-05-01T14:25:00Z",
          "attachments": []
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440013",
          "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
          "sender_type": "end_user",
          "sender_id": "550e8400-e29b-41d4-a716-446655440002",
          "content": "I'm interested in your enterprise plan",
          "content_type": "text",
          "is_internal": false,
          "created_at": "2025-05-01T14:30:00Z",
          "delivered_at": "2025-05-01T14:30:01Z",
          "read_at": null,
          "attachments": []
        }
      ],
      "pagination": {
        "total": 5,
        "page": 1,
        "limit": 50,
        "pages": 1
      }
    }
  }
}
```

### 3. Update Conversation Status

Update the status of a conversation.

#### Request

```http
PATCH /conversations/{conversationId}/status
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

#### Path Parameters

| Parameter      | Type | Description                |
| -------------- | ---- | -------------------------- |
| conversationId | UUID | The ID of the conversation |

#### Request Body

```json
{
  "status": "pending",
  "note": "Waiting for customer response on pricing details"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "pending",
      "updated_at": "2025-05-02T09:15:00Z",
      "updated_by": {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "first_name": "Jane",
        "last_name": "Smith"
      }
    }
  }
}
```

### 4. Assign Conversation

Assign a conversation to a user or team.

#### Request

```http
PATCH /conversations/{conversationId}/assign
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

#### Path Parameters

| Parameter      | Type | Description                |
| -------------- | ---- | -------------------------- |
| conversationId | UUID | The ID of the conversation |

#### Request Body

```json
{
  "assigned_user_id": "550e8400-e29b-41d4-a716-446655440015",
  "assigned_team_id": "550e8400-e29b-41d4-a716-446655440005",
  "note": "Assigning to technical team for product-specific questions"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "assigned_user": {
        "id": "550e8400-e29b-41d4-a716-446655440015",
        "first_name": "Alex",
        "last_name": "Johnson"
      },
      "assigned_team": {
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "name": "Sales Team"
      },
      "updated_at": "2025-05-02T09:30:00Z",
      "updated_by": {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "first_name": "Jane",
        "last_name": "Smith"
      }
    }
  }
}
```

### 5. Send Message in Conversation

Send a new message in a conversation.

#### Request

```http
POST /conversations/{conversationId}/messages
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

#### Path Parameters

| Parameter      | Type | Description                |
| -------------- | ---- | -------------------------- |
| conversationId | UUID | The ID of the conversation |

#### Request Body

```json
{
  "content": "Thank you for your interest! Our enterprise plan starts at ₹25,000 per month. Would you like to schedule a call to discuss further?",
  "content_type": "text",
  "is_internal": false,
  "attachments": []
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "message": {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
      "sender_type": "business_user",
      "sender_id": "550e8400-e29b-41d4-a716-446655440004",
      "content": "Thank you for your interest! Our enterprise plan starts at ₹25,000 per month. Would you like to schedule a call to discuss further?",
      "content_type": "text",
      "is_internal": false,
      "created_at": "2025-05-02T10:00:00Z",
      "delivered_at": null,
      "read_at": null,
      "attachments": []
    }
  }
}
```

### 6. Send Internal Note

Send an internal message that is only visible to business users.

#### Request

```http
POST /conversations/{conversationId}/notes
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

#### Path Parameters

| Parameter      | Type | Description                |
| -------------- | ---- | -------------------------- |
| conversationId | UUID | The ID of the conversation |

#### Request Body

```json
{
  "content": "Customer is considering the enterprise plan but may need approval from their management. Follow up next week if they don't respond.",
  "mentioned_users": ["550e8400-e29b-41d4-a716-446655440015"]
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "message": {
      "id": "550e8400-e29b-41d4-a716-446655440021",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
      "sender_type": "business_user",
      "sender_id": "550e8400-e29b-41d4-a716-446655440004",
      "content": "Customer is considering the enterprise plan but may need approval from their management. Follow up next week if they don't respond.",
      "content_type": "text",
      "is_internal": true,
      "created_at": "2025-05-02T10:05:00Z",
      "mentioned_users": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440015",
          "first_name": "Alex",
          "last_name": "Johnson"
        }
      ]
    }
  }
}
```

### 7. Add Tag to Conversation

Add a tag to a conversation for easier categorization and filtering.

#### Request

```http
POST /conversations/{conversationId}/tags
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

#### Path Parameters

| Parameter      | Type | Description                |
| -------------- | ---- | -------------------------- |
| conversationId | UUID | The ID of the conversation |

#### Request Body

```json
{
  "tag_id": "550e8400-e29b-41d4-a716-446655440025"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "tag": {
      "id": "550e8400-e29b-41d4-a716-446655440025",
      "name": "high-value",
      "color": "#FF5733"
    }
  }
}
```

### 8. Remove Tag from Conversation

Remove a tag from a conversation.

#### Request

```http
DELETE /conversations/{conversationId}/tags/{tagId}
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

#### Path Parameters

| Parameter      | Type | Description                 |
| -------------- | ---- | --------------------------- |
| conversationId | UUID | The ID of the conversation  |
| tagId          | UUID | The ID of the tag to remove |

#### Response

```json
{
  "success": true,
  "message": "Tag removed successfully"
}
```

### 9. Get Conversation Statistics

Get statistics about conversations for the business.

#### Request

```http
GET /conversations/statistics
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

#### Query Parameters

| Parameter  | Type   | Description                                        |
| ---------- | ------ | -------------------------------------------------- |
| start_date | string | Start date for the statistics (format: YYYY-MM-DD) |
| end_date   | string | End date for the statistics (format: YYYY-MM-DD)   |
| team_id    | UUID   | Filter by team ID                                  |

#### Response

```json
{
  "success": true,
  "data": {
    "total_conversations": 450,
    "active_conversations": 150,
    "pending_conversations": 75,
    "closed_conversations": 225,
    "average_resolution_time": "2h 45m",
    "average_first_response_time": "5m 20s",
    "conversation_by_channel": {
      "whatsapp": 320,
      "sms": 80,
      "web": 50
    },
    "conversation_by_status": {
      "active": 150,
      "pending": 75,
      "closed": 225
    },
    "conversation_by_day": {
      "2025-04-25": 30,
      "2025-04-26": 35,
      "2025-04-27": 20,
      "2025-04-28": 40,
      "2025-04-29": 45,
      "2025-04-30": 50,
      "2025-05-01": 55
    }
  }
}
```

## Error Responses

The API uses standard HTTP status codes to indicate success or failure.

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "status": "Status must be one of: active, pending, closed"
    }
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication credentials are missing or invalid"
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to update conversation status"
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Conversation not found"
  }
}
```

### 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Cannot send message to a closed conversation"
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Implementation Notes

### Database Schema Considerations

The Team Inbox feature uses the following key tables from the database schema:

1. `conversation` - Core entity for conversation management
2. `message` - Individual messages within a conversation
3. `conversation_tag` - Tagging relationships for conversations
4. `tag` - Tag definitions
5. `end_user` - Customer information
6. `business_user` - Business staff information
7. `team` - Team information

### Security Considerations

1. All endpoints require authentication via JWT tokens
2. Role-based access control restricts capabilities:
   - Super Admin and Admin: Full access
   - Executive: Can view and update conversations
   - Viewer: Read-only access
3. Conversations are tenant-isolated by `business_id`
4. Internal notes (`is_internal = true`) are only visible to business users

### Real-time Updates

For real-time updates to conversations and messages, the application uses WebSockets. Clients should subscribe to relevant conversation channels to receive real-time updates, including:

- New messages
- Status changes
- Assignment changes
- Tag updates

### Filtering Capabilities

The Team Inbox provides comprehensive filtering options including:

1. **Status-based filtering**:

   - Active conversations
   - Pending conversations
   - Closed conversations

2. **Source-based filtering**:

   - By campaign
   - By broadcast
   - By channel

3. **Content-based filtering**:

   - Search by contact name or phone
   - Search by message content

4. **Time-based filtering**:

   - Last 24 hours
   - Last 7 days
   - Last 30 days

5. **Assignment-based filtering**:
   - By assigned user
   - By assigned team

### Conversation Status Management

Conversations have three primary statuses:

1. **Active**: Ongoing conversations that require attention
2. **Pending**: Conversations awaiting further action
3. **Closed**: Resolved conversations

Note that business users cannot send messages to closed conversations. A closed conversation must be reopened (status changed to active) before new messages can be sent.

### Message Types

Messages can be of different types:

1. **Text messages**: Regular text-based messages
2. **Media messages**: Messages with attachments (images, documents, etc.)
3. **Internal notes**: Messages that are only visible to business users
4. **System messages**: Automated messages about status changes, assignments, etc.

## Conclusion

This API documentation provides a comprehensive framework for the Team Inbox feature of the Just Ping platform. The endpoints are designed to support all the required functionality for managing customer conversations, including viewing conversation lists, message history, changing conversation status, and applying various filters.

The implementation aligns with the overall architecture of the Just Ping platform and follows best practices for RESTful API design, security, and scalability.
